# Web3 Wallet Authentication - Rust Backend Implementation

This document provides complete instructions for implementing Web3 wallet authentication in Rust that integrates with Supabase Auth.

## Overview

The backend will:
1. Verify Solana wallet signatures
2. Create/retrieve Supabase user accounts linked to wallet addresses
3. Generate Supabase JWT tokens for authenticated sessions
4. Return session data that the frontend can use with existing Supabase client

## Dependencies

Add these dependencies to your `Cargo.toml`:

```toml
[dependencies]
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
reqwest = { version = "0.11", features = ["json"] }
axum = "0.7"
tower = "0.4"
tower-http = { version = "0.5", features = ["cors"] }
anyhow = "1.0"
thiserror = "1.0"
base58 = "0.2"
ed25519-dalek = "2.0"
url = "2.4"
uuid = { version = "1.0", features = ["v4"] }
chrono = { version = "0.4", features = ["serde"] }
dotenv = "0.15"

[dependencies.clap]
version = "4.0"
features = ["derive", "env"]
```

## Environment Configuration

Create `src/config.rs`:

```rust
use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub supabase_url: String,
    pub supabase_service_key: String,
    pub server_port: u16,
}

impl Config {
    pub fn from_env() -> Result<Self, env::VarError> {
        Ok(Config {
            supabase_url: env::var("SUPABASE_URL")?,
            supabase_service_key: env::var("SUPABASE_SERVICE_ROLE_KEY")?,
            server_port: env::var("PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()
                .unwrap_or(3000),
        })
    }
}
```

## Error Handling

Create `src/error.rs`:

```rust
use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AuthError {
    #[error("Invalid signature")]
    InvalidSignature,
    #[error("Missing required field: {field}")]
    MissingField { field: String },
    #[error("Invalid wallet address")]
    InvalidWalletAddress,
    #[error("Supabase error: {0}")]
    SupabaseError(String),
    #[error("Internal server error")]
    InternalError,
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            AuthError::InvalidSignature => (StatusCode::UNAUTHORIZED, "Invalid signature"),
            AuthError::MissingField { .. } => (StatusCode::BAD_REQUEST, &self.to_string()),
            AuthError::InvalidWalletAddress => (StatusCode::BAD_REQUEST, "Invalid wallet address"),
            AuthError::SupabaseError(_) => (StatusCode::INTERNAL_SERVER_ERROR, "Authentication service error"),
            AuthError::InternalError => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error"),
        };

        let body = Json(json!({
            "error": error_message
        }));

        (status, body).into_response()
    }
}
```

## Signature Verification

Create `src/crypto.rs`:

```rust
use base58;
use ed25519_dalek::{PublicKey, Signature, Verifier};
use crate::error::AuthError;

pub fn verify_solana_signature(
    wallet_address: &str,
    signature: &str,
    message: &str,
) -> Result<bool, AuthError> {
    // Decode wallet address from base58
    let public_key_bytes = base58::decode(wallet_address)
        .map_err(|_| AuthError::InvalidWalletAddress)?;
    
    if public_key_bytes.len() != 32 {
        return Err(AuthError::InvalidWalletAddress);
    }
    
    // Create PublicKey
    let public_key = PublicKey::from_bytes(&public_key_bytes)
        .map_err(|_| AuthError::InvalidWalletAddress)?;
    
    // Decode signature from base58
    let signature_bytes = base58::decode(signature)
        .map_err(|_| AuthError::InvalidSignature)?;
    
    if signature_bytes.len() != 64 {
        return Err(AuthError::InvalidSignature);
    }
    
    // Create Signature
    let signature = Signature::from_bytes(&signature_bytes)
        .map_err(|_| AuthError::InvalidSignature)?;
    
    // Verify signature
    let message_bytes = message.as_bytes();
    
    match public_key.verify(message_bytes, &signature) {
        Ok(()) => Ok(true),
        Err(_) => Ok(false),
    }
}

pub fn validate_message(message: &str, wallet_address: &str) -> bool {
    // Check required content
    if !message.contains("Sign in to Rekt App") {
        return false;
    }
    
    if !message.contains(wallet_address) {
        return false;
    }
    
    // Extract and validate timestamp (5 minute window)
    if let Some(timestamp_str) = extract_timestamp(message) {
        if let Ok(timestamp) = timestamp_str.parse::<i64>() {
            let now = chrono::Utc::now().timestamp_millis();
            let five_minutes_ago = now - (5 * 60 * 1000);
            
            if timestamp < five_minutes_ago {
                return false;
            }
        }
    }
    
    true
}

fn extract_timestamp(message: &str) -> Option<&str> {
    // Extract timestamp from "Timestamp: 1234567890"
    message
        .lines()
        .find(|line| line.starts_with("Timestamp: "))
        .and_then(|line| line.strip_prefix("Timestamp: "))
}
```

## Supabase Client

Create `src/supabase.rs`:

```rust
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;
use crate::{config::Config, error::AuthError};

#[derive(Debug, Clone)]
pub struct SupabaseClient {
    client: Client,
    base_url: String,
    service_key: String,
}

#[derive(Serialize, Deserialize)]
pub struct SupabaseUser {
    pub id: String,
    pub email: String,
    pub user_metadata: serde_json::Value,
}

#[derive(Serialize, Deserialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub user_metadata: serde_json::Value,
    pub email_confirm: bool,
}

#[derive(Serialize, Deserialize)]
pub struct CreateUserResponse {
    pub user: SupabaseUser,
}

#[derive(Serialize, Deserialize)]
pub struct GenerateLinkRequest {
    #[serde(rename = "type")]
    pub link_type: String,
    pub email: String,
    pub options: Option<serde_json::Value>,
}

#[derive(Serialize, Deserialize)]
pub struct GenerateLinkResponse {
    pub properties: LinkProperties,
}

#[derive(Serialize, Deserialize)]
pub struct LinkProperties {
    pub action_link: String,
}

#[derive(Serialize, Deserialize)]
pub struct ListUsersResponse {
    pub users: Vec<SupabaseUser>,
}

impl SupabaseClient {
    pub fn new(config: &Config) -> Self {
        Self {
            client: Client::new(),
            base_url: config.supabase_url.clone(),
            service_key: config.supabase_service_key.clone(),
        }
    }

    pub async fn list_users(&self) -> Result<Vec<SupabaseUser>, AuthError> {
        let url = format!("{}/auth/v1/admin/users", self.base_url);
        
        let response = self
            .client
            .get(&url)
            .header("Authorization", format!("Bearer {}", self.service_key))
            .header("apikey", &self.service_key)
            .send()
            .await
            .map_err(|_| AuthError::SupabaseError("Failed to list users".to_string()))?;

        if !response.status().is_success() {
            return Err(AuthError::SupabaseError("Failed to list users".to_string()));
        }

        let users_response: ListUsersResponse = response
            .json()
            .await
            .map_err(|_| AuthError::SupabaseError("Failed to parse users response".to_string()))?;

        Ok(users_response.users)
    }

    pub async fn create_user(&self, wallet_address: &str) -> Result<SupabaseUser, AuthError> {
        let url = format!("{}/auth/v1/admin/users", self.base_url);
        
        let request = CreateUserRequest {
            email: format!("{}@wallet.local", wallet_address),
            user_metadata: json!({
                "wallet_address": wallet_address,
                "auth_method": "web3"
            }),
            email_confirm: true,
        };

        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.service_key))
            .header("apikey", &self.service_key)
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|_| AuthError::SupabaseError("Failed to create user".to_string()))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AuthError::SupabaseError(format!("Failed to create user: {}", error_text)));
        }

        let create_response: CreateUserResponse = response
            .json()
            .await
            .map_err(|_| AuthError::SupabaseError("Failed to parse create user response".to_string()))?;

        Ok(create_response.user)
    }

    pub async fn generate_magic_link(&self, wallet_address: &str) -> Result<String, AuthError> {
        let url = format!("{}/auth/v1/admin/generate_link", self.base_url);
        
        let request = GenerateLinkRequest {
            link_type: "magiclink".to_string(),
            email: format!("{}@wallet.local", wallet_address),
            options: Some(json!({
                "redirect_to": "rektreactnative://auth/callback"
            })),
        };

        let response = self
            .client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.service_key))
            .header("apikey", &self.service_key)
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|_| AuthError::SupabaseError("Failed to generate link".to_string()))?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(AuthError::SupabaseError(format!("Failed to generate link: {}", error_text)));
        }

        let link_response: GenerateLinkResponse = response
            .json()
            .await
            .map_err(|_| AuthError::SupabaseError("Failed to parse link response".to_string()))?;

        Ok(link_response.properties.action_link)
    }
}
```

## Request/Response Types

Create `src/types.rs`:

```rust
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct WalletAuthRequest {
    pub wallet_address: String,
    pub signature: String,
    pub message: String,
}

#[derive(Serialize)]
pub struct SessionResponse {
    pub session: SessionData,
}

#[derive(Serialize)]
pub struct SessionData {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: u32,
    pub token_type: String,
    pub user: UserData,
}

#[derive(Serialize)]
pub struct UserData {
    pub id: String,
    pub wallet_address: String,
}
```

## Authentication Handler

Create `src/handlers.rs`:

```rust
use axum::{extract::State, Json};
use url::Url;
use crate::{
    config::Config,
    crypto::{verify_solana_signature, validate_message},
    error::AuthError,
    supabase::SupabaseClient,
    types::{WalletAuthRequest, SessionResponse, SessionData, UserData},
};

pub async fn authenticate_wallet(
    State(config): State<Config>,
    Json(payload): Json<WalletAuthRequest>,
) -> Result<Json<SessionResponse>, AuthError> {
    // Validate inputs
    if payload.wallet_address.is_empty() {
        return Err(AuthError::MissingField { field: "wallet_address".to_string() });
    }
    if payload.signature.is_empty() {
        return Err(AuthError::MissingField { field: "signature".to_string() });
    }
    if payload.message.is_empty() {
        return Err(AuthError::MissingField { field: "message".to_string() });
    }

    // Validate message format and timestamp
    if !validate_message(&payload.message, &payload.wallet_address) {
        return Err(AuthError::InvalidSignature);
    }

    // Verify signature
    let is_valid = verify_solana_signature(
        &payload.wallet_address,
        &payload.signature,
        &payload.message,
    )?;

    if !is_valid {
        return Err(AuthError::InvalidSignature);
    }

    // Initialize Supabase client
    let supabase = SupabaseClient::new(&config);

    // Check if user exists
    let users = supabase.list_users().await?;
    let existing_user = users.iter().find(|user| {
        user.user_metadata
            .get("wallet_address")
            .and_then(|v| v.as_str())
            == Some(&payload.wallet_address)
    });

    let user_id = if let Some(user) = existing_user {
        user.id.clone()
    } else {
        // Create new user
        let new_user = supabase.create_user(&payload.wallet_address).await?;
        new_user.id
    };

    // Generate magic link and extract tokens
    let action_link = supabase.generate_magic_link(&payload.wallet_address).await?;
    
    let url = Url::parse(&action_link)
        .map_err(|_| AuthError::SupabaseError("Invalid action link".to_string()))?;
    
    let access_token = url
        .query_pairs()
        .find(|(key, _)| key == "access_token")
        .map(|(_, value)| value.to_string())
        .ok_or_else(|| AuthError::SupabaseError("No access token in response".to_string()))?;
    
    let refresh_token = url
        .query_pairs()
        .find(|(key, _)| key == "refresh_token")
        .map(|(_, value)| value.to_string())
        .unwrap_or_else(|| access_token.clone());

    // Return session data
    let response = SessionResponse {
        session: SessionData {
            access_token,
            refresh_token,
            expires_in: 3600,
            token_type: "bearer".to_string(),
            user: UserData {
                id: user_id,
                wallet_address: payload.wallet_address,
            },
        },
    };

    Ok(Json(response))
}

pub async fn health_check() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "message": "Wallet auth endpoint is ready",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}
```

## Main Server

Create `src/main.rs`:

```rust
mod config;
mod crypto;
mod error;
mod handlers;
mod supabase;
mod types;

use axum::{
    routing::{get, post},
    Router,
};
use tower::ServiceBuilder;
use tower_http::cors::CorsLayer;
use config::Config;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables
    dotenv::dotenv().ok();
    
    // Load configuration
    let config = Config::from_env()?;
    
    // Build CORS layer
    let cors = CorsLayer::permissive(); // Configure as needed for production
    
    // Build the application
    let app = Router::new()
        .route("/api/auth/wallet", post(handlers::authenticate_wallet))
        .route("/api/auth/test-wallet", get(handlers::health_check))
        .layer(ServiceBuilder::new().layer(cors))
        .with_state(config.clone());

    // Start the server
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", config.server_port)).await?;
    
    println!("Server running on port {}", config.server_port);
    
    axum::serve(listener, app).await?;

    Ok(())
}
```

## Environment Variables

Create `.env` file:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PORT=3000
```

## Running the Server

```bash
# Development
cargo run

# Production build
cargo build --release
./target/release/your-app-name
```

## API Contract

### Authentication Endpoint

**POST** `/api/auth/wallet`

**Request Body:**
```json
{
  "wallet_address": "string",  // Base58 Solana public key
  "signature": "string",       // Base58 encoded signature
  "message": "string"          // The exact message that was signed
}
```

**Success Response (200):**
```json
{
  "session": {
    "access_token": "string",
    "refresh_token": "string",
    "expires_in": 3600,
    "token_type": "bearer",
    "user": {
      "id": "string",
      "wallet_address": "string"
    }
  }
}
```

**Error Responses:**
- `400`: Missing required fields or invalid message format
- `401`: Invalid signature
- `500`: Server error

### Health Check Endpoint

**GET** `/api/auth/test-wallet`

**Response:**
```json
{
  "message": "Wallet auth endpoint is ready",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Message Format Specification

The frontend must use this exact message format:

```
Sign in to Rekt App

Wallet: {wallet_address}
Timestamp: {timestamp_in_milliseconds}
Nonce: {random_string}

This request will not trigger a blockchain transaction or cost any gas fees.
```

## Security Considerations

1. **Rate Limiting**: Implement rate limiting on the auth endpoint
2. **Message Validation**: Validates message format and timestamp (5-minute window)
3. **CORS**: Configure CORS appropriately for production
4. **Logging**: Log authentication attempts for monitoring
5. **Service Key Security**: Never expose the Supabase service role key
6. **Signature Verification**: Uses ed25519-dalek for cryptographic verification

## Testing

Test the implementation:

```bash
# Health check
curl http://localhost:3000/api/auth/test-wallet

# Authentication (replace with actual values)
curl -X POST http://localhost:3000/api/auth/wallet \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "your_wallet_address",
    "signature": "your_signature", 
    "message": "your_message"
  }'
```

This implementation provides secure Web3 wallet authentication that integrates seamlessly with Supabase Auth and maintains session persistence across app restarts.
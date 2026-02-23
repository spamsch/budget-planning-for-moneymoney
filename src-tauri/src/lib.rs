mod llm;
mod moneymoney;
mod persistence;

use chrono::NaiveDate;

#[tauri::command]
async fn fetch_categories() -> Result<Vec<moneymoney::Category>, String> {
    tauri::async_runtime::spawn_blocking(moneymoney::get_categories)
        .await
        .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
async fn fetch_accounts() -> Result<Vec<moneymoney::Account>, String> {
    tauri::async_runtime::spawn_blocking(moneymoney::get_accounts)
        .await
        .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
async fn fetch_transactions(
    from: String,
    to: String,
    accounts: Vec<String>,
) -> Result<Vec<moneymoney::Transaction>, String> {
    let from_date =
        NaiveDate::parse_from_str(&from, "%Y-%m-%d").map_err(|e| format!("Invalid from date: {}", e))?;
    let to_date =
        NaiveDate::parse_from_str(&to, "%Y-%m-%d").map_err(|e| format!("Invalid to date: {}", e))?;

    tauri::async_runtime::spawn_blocking(move || {
        moneymoney::get_transactions(from_date, to_date, &accounts)
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[tauri::command]
async fn load_budget(name: String) -> Result<persistence::BudgetTemplate, String> {
    persistence::load_budget(&name)
}

#[tauri::command]
async fn save_budget(budget: persistence::BudgetTemplate) -> Result<(), String> {
    persistence::save_budget(&budget)
}

#[tauri::command]
async fn list_budgets() -> Result<Vec<String>, String> {
    persistence::list_budgets()
}

#[tauri::command]
async fn delete_budget(name: String) -> Result<(), String> {
    persistence::delete_budget(&name)
}

#[tauri::command]
async fn load_app_config() -> Result<llm::AppConfig, String> {
    llm::load_config()
}

#[tauri::command]
async fn save_app_config(config: llm::AppConfig) -> Result<(), String> {
    llm::save_config(&config)
}

#[tauri::command]
async fn chat_completion(
    api_key: String,
    model: String,
    messages: Vec<llm::ChatMessage>,
) -> Result<String, String> {
    llm::chat_completion(&api_key, &model, messages).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            fetch_categories,
            fetch_accounts,
            fetch_transactions,
            load_budget,
            save_budget,
            list_budgets,
            delete_budget,
            load_app_config,
            save_app_config,
            chat_completion,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::io::Write;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UnplannedTransaction {
    pub tx_id: i64,
    pub name: String,
    pub amount: f64,
    pub booking_date: String,
    pub purpose: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BudgetTemplate {
    pub name: String,
    pub version: String,
    pub settings: BudgetSettings,
    pub template: HashMap<String, TemplateEntry>,
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    pub comments: HashMap<String, HashMap<String, String>>,
    #[serde(default, skip_serializing_if = "HashMap::is_empty")]
    pub unplanned: HashMap<String, HashMap<String, Vec<UnplannedTransaction>>>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub scenarios: Vec<Scenario>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ScenarioOverride {
    pub amount: f64,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub line_items: Vec<LineItem>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct VirtualItem {
    pub id: String,
    pub name: String,
    pub amount: f64,
    #[serde(default)]
    pub is_income: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Scenario {
    pub id: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    pub created_at: String,
    pub overrides: HashMap<String, ScenarioOverride>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub virtual_items: Vec<VirtualItem>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BudgetSettings {
    pub currency: String,
    pub accounts: Vec<String>,
    pub income_categories: Vec<String>,
    #[serde(default)]
    pub excluded_categories: Vec<String>,
    pub start_date: String,
    #[serde(default)]
    pub custom_entities: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LineItem {
    pub id: String,
    pub name: String,
    pub amount: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TemplateEntry {
    pub amount: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source_account: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_account: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub line_items: Vec<LineItem>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
}

fn budgets_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not determine home directory")?;
    let dir = home.join(".budgetplanner").join("budgets");
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create budgets directory: {}", e))?;
    Ok(dir)
}

fn budget_path(name: &str) -> Result<PathBuf, String> {
    if name.contains('/') || name.contains('\\') || name.contains("..") {
        return Err("Invalid budget name".to_string());
    }
    Ok(budgets_dir()?.join(format!("{}.json", name)))
}

pub fn load_budget(name: &str) -> Result<BudgetTemplate, String> {
    let path = budget_path(name)?;
    let data = fs::read_to_string(&path).map_err(|e| format!("Failed to read budget: {}", e))?;
    serde_json::from_str(&data).map_err(|e| format!("Failed to parse budget: {}", e))
}

pub fn save_budget(budget: &BudgetTemplate) -> Result<(), String> {
    let path = budget_path(&budget.name)?;
    let data =
        serde_json::to_string_pretty(budget).map_err(|e| format!("Failed to serialize: {}", e))?;

    // Atomic write: write to temp file, then rename
    let tmp_path = path.with_extension("json.tmp");
    let mut file =
        fs::File::create(&tmp_path).map_err(|e| format!("Failed to create temp file: {}", e))?;
    file.write_all(data.as_bytes())
        .map_err(|e| format!("Failed to write temp file: {}", e))?;
    file.sync_all()
        .map_err(|e| format!("Failed to sync temp file: {}", e))?;
    fs::rename(&tmp_path, &path).map_err(|e| format!("Failed to rename temp file: {}", e))?;

    Ok(())
}

pub fn list_budgets() -> Result<Vec<String>, String> {
    let dir = budgets_dir()?;
    let mut names = Vec::new();
    let entries = fs::read_dir(&dir).map_err(|e| format!("Failed to read directory: {}", e))?;
    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("json") {
            if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                names.push(stem.to_string());
            }
        }
    }
    names.sort();
    Ok(names)
}

pub fn delete_budget(name: &str) -> Result<(), String> {
    let path = budget_path(name)?;
    if path.exists() {
        fs::remove_file(&path).map_err(|e| format!("Failed to delete budget: {}", e))?;
    }
    Ok(())
}

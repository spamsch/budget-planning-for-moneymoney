use chrono::{DateTime, NaiveDate, Utc};
use moneymoney::export_accounts::MoneymoneyAccount;
use moneymoney::export_categories::MoneymoneyCategory;
use moneymoney::export_transactions::{ExportTransactionsParams, MoneymoneyTransaction};
use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub uuid: String,
    pub name: String,
    pub currency: String,
    pub group: bool,
    pub indentation: u8,
    pub is_default: bool,
    pub budget_amount: Option<f64>,
    pub budget_available: Option<f64>,
    pub budget_period: Option<String>,
}

impl From<MoneymoneyCategory> for Category {
    fn from(c: MoneymoneyCategory) -> Self {
        Self {
            uuid: c.uuid.to_string(),
            name: c.name,
            currency: format!("{}", c.currency),
            group: c.group,
            indentation: c.indentation,
            is_default: c.default,
            budget_amount: c.budget.as_ref().map(|b| b.amount),
            budget_available: c.budget.as_ref().map(|b| b.available),
            budget_period: c.budget.as_ref().map(|b| b.period.clone()),
        }
    }
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Account {
    pub uuid: String,
    pub name: String,
    pub account_number: String,
    pub bank_code: String,
    pub currency: String,
    pub balance_amount: f64,
    pub balance_currency: String,
    pub group: bool,
    pub indentation: u8,
    pub owner: String,
    pub account_type: String,
    pub portfolio: bool,
}

impl From<MoneymoneyAccount> for Account {
    fn from(a: MoneymoneyAccount) -> Self {
        Self {
            uuid: a.uuid.to_string(),
            name: a.name,
            account_number: a.account_number,
            bank_code: a.bank_code,
            currency: a.currency,
            balance_amount: a.balance.amount,
            balance_currency: format!("{}", a.balance.currency),
            group: a.group,
            indentation: a.indentation,
            owner: a.owner,
            account_type: format!("{:?}", a.r#type),
            portfolio: a.portfolio,
        }
    }
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Transaction {
    pub id: u64,
    pub amount: f64,
    pub currency: String,
    pub booking_date: DateTime<Utc>,
    pub value_date: DateTime<Utc>,
    pub name: String,
    pub purpose: Option<String>,
    pub category_uuid: String,
    pub account_uuid: String,
    pub booked: bool,
    pub checkmark: bool,
}

impl From<MoneymoneyTransaction> for Transaction {
    fn from(t: MoneymoneyTransaction) -> Self {
        Self {
            id: t.id,
            amount: t.amount,
            currency: t.currency,
            booking_date: t.booking_date,
            value_date: t.value_date,
            name: t.name,
            purpose: t.purpose,
            category_uuid: t.category_uuid.to_string(),
            account_uuid: t.account_uuid.to_string(),
            booked: t.booked,
            checkmark: t.checkmark,
        }
    }
}

pub fn get_categories() -> Result<Vec<Category>, String> {
    let cats = moneymoney::export_categories::call().map_err(|e| format!("{:?}", e))?;
    Ok(cats.into_iter().map(Category::from).collect())
}

pub fn get_accounts() -> Result<Vec<Account>, String> {
    // NOTE: export_accounts::call() panics on error in v0.1.1
    let accounts = std::panic::catch_unwind(|| moneymoney::export_accounts::call())
        .map_err(|_| "Failed to fetch accounts from MoneyMoney".to_string())?;
    Ok(accounts.into_iter().map(Account::from).collect())
}

pub fn get_transactions(
    from: NaiveDate,
    to: NaiveDate,
    account_uuids: &[String],
) -> Result<Vec<Transaction>, String> {
    let params = ExportTransactionsParams {
        from_date: from,
        to_date: Some(to.format("%Y-%m-%d").to_string()),
        from_account: None,
        from_category: None,
    };
    let response =
        moneymoney::export_transactions::call(params).map_err(|e| format!("{:?}", e))?;
    let transactions: Vec<Transaction> = response
        .transactions
        .into_iter()
        .map(Transaction::from)
        .filter(|t| account_uuids.is_empty() || account_uuids.contains(&t.account_uuid))
        .collect();
    Ok(transactions)
}

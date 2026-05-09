from sqlmodel import Session, select
from app.database import engine
from app.models import Provider, Preset, SchemaField


def seed_data():
    with Session(engine) as session:
        existing = session.exec(select(Provider)).first()
        if existing:
            return

        providers = [
            Provider(name="OpenAI", base_url="https://api.openai.com/v1", default_model="gpt-4o", active=True),
            Provider(name="OpenRouter", base_url="https://openrouter.ai/api/v1", default_model="openai/gpt-4o", active=False),
            Provider(name="Local Llama", base_url="http://localhost:11434/v1", default_model="llama3.1", active=False),
        ]
        for p in providers:
            session.add(p)
        session.commit()

        presets_data = [
            {
                "name": "Bug Report Generator",
                "description": "Extract structured bug report from logs",
                "tags": "bugs",
                "system_prompt": "You are an expert at analyzing application logs and creating structured bug reports. Extract all relevant information and return it in the specified JSON format.",
                "user_prompt_template": "Analyze the following logs and create a bug report:\n\n{{input}}",
                "temperature": 0.2,
                "max_completion_tokens": 2000,
                "fields": [
                    {"name": "title", "type": "string", "required": True, "description": "Short bug title", "example": "Login button throws 500 error"},
                    {"name": "severity", "type": "enum", "required": True, "description": "Severity level", "enum_values": "low,medium,high,critical"},
                    {"name": "reproduction_steps", "type": "list[string]", "required": True, "description": "Steps to reproduce"},
                    {"name": "expected_result", "type": "string", "required": True, "description": "Expected behavior"},
                    {"name": "actual_result", "type": "string", "required": True, "description": "Actual behavior"},
                    {"name": "possible_cause", "type": "string", "required": False, "description": "Possible root cause"},
                    {"name": "suggested_fix", "type": "string", "required": False, "description": "Suggested fix"},
                ],
            },
            {
                "name": "Business Email Generator",
                "description": "Generate professional emails",
                "tags": "email",
                "system_prompt": "You are a professional business communication assistant. Generate polished business emails based on the provided context.",
                "user_prompt_template": "Write a business email about:\n\n{{input}}",
                "temperature": 0.5,
                "max_completion_tokens": 1500,
                "fields": [
                    {"name": "subject", "type": "string", "required": True, "description": "Email subject line"},
                    {"name": "greeting", "type": "string", "required": True, "description": "Email greeting"},
                    {"name": "body", "type": "string", "required": True, "description": "Email body content"},
                    {"name": "closing", "type": "string", "required": True, "description": "Email closing"},
                    {"name": "tone", "type": "enum", "required": True, "description": "Email tone", "enum_values": "formal,casual,friendly,urgent"},
                ],
            },
            {
                "name": "Feature Spec Generator",
                "description": "Create feature specifications",
                "tags": "spec",
                "system_prompt": "You are a product manager assistant. Create detailed feature specifications from brief descriptions.",
                "user_prompt_template": "Create a feature spec for:\n\n{{input}}",
                "temperature": 0.3,
                "max_completion_tokens": 2500,
                "fields": [
                    {"name": "feature_name", "type": "string", "required": True, "description": "Feature name"},
                    {"name": "overview", "type": "string", "required": True, "description": "Feature overview"},
                    {"name": "goals", "type": "list[string]", "required": True, "description": "Feature goals"},
                    {"name": "requirements", "type": "list[string]", "required": True, "description": "Requirements"},
                    {"name": "acceptance_criteria", "type": "list[string]", "required": True, "description": "Acceptance criteria"},
                ],
            },
            {
                "name": "DB Import Mapper",
                "description": "Map CSV data to database schema",
                "tags": "data",
                "system_prompt": "You are a database specialist. Map CSV columns to database table schemas and suggest transformations.",
                "user_prompt_template": "Map the following CSV data to a database schema:\n\n{{input}}",
                "temperature": 0.2,
                "max_completion_tokens": 2000,
                "fields": [
                    {"name": "table_name", "type": "string", "required": True, "description": "Suggested table name"},
                    {"name": "columns", "type": "list[object]", "required": True, "description": "Column mappings"},
                    {"name": "data_types", "type": "object", "required": True, "description": "Suggested data types"},
                    {"name": "transformations", "type": "list[string]", "required": False, "description": "Suggested transformations"},
                ],
            },
            {
                "name": "Support Ticket Classifier",
                "description": "Classify and summarize tickets",
                "tags": "support",
                "system_prompt": "You are a customer support analyst. Classify support tickets and provide structured summaries.",
                "user_prompt_template": "Classify and summarize this support ticket:\n\n{{input}}",
                "temperature": 0.2,
                "max_completion_tokens": 1500,
                "fields": [
                    {"name": "category", "type": "enum", "required": True, "description": "Ticket category", "enum_values": "bug,feature_request,billing,account,technical,other"},
                    {"name": "priority", "type": "enum", "required": True, "description": "Priority level", "enum_values": "low,medium,high,urgent"},
                    {"name": "summary", "type": "string", "required": True, "description": "Brief summary"},
                    {"name": "sentiment", "type": "enum", "required": True, "description": "Customer sentiment", "enum_values": "positive,neutral,negative,frustrated"},
                    {"name": "suggested_response", "type": "string", "required": False, "description": "Suggested response"},
                ],
            },
        ]

        for p_data in presets_data:
            fields_data = p_data.pop("fields")
            preset = Preset(**p_data)
            session.add(preset)
            session.commit()
            session.refresh(preset)

            for idx, f_data in enumerate(fields_data):
                field = SchemaField(preset_id=preset.id, **f_data, order=idx)
                session.add(field)
            session.commit()

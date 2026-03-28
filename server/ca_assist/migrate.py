import sqlite3

def run_migration():
    conn = sqlite3.connect('ca_assist.db')
    c = conn.cursor()
    
    # Try adding columns individually
    cols = [
        ('filename', 'VARCHAR'),
        ('file_type', 'VARCHAR'),
        ('document_type', 'VARCHAR'),
        ('extracted_fields', 'JSON'),
        ('chunks_added', 'INTEGER'),
        ('is_relevant_for_regime', 'BOOLEAN'),
        ('is_relevant_for_forex', 'BOOLEAN'),
        ('is_relevant_for_fund', 'BOOLEAN')
    ]
    
    for col_name, col_type in cols:
        try:
            c.execute(f"ALTER TABLE user_documents ADD COLUMN {col_name} {col_type}")
            print(f"Added column {col_name}")
        except sqlite3.OperationalError as e:
            if 'duplicate column name' in str(e).lower():
                print(f"Column {col_name} already exists")
            else:
                print(f"Error adding {col_name}: {e}")
                
    conn.commit()
    conn.close()
    print("Migration finished.")

if __name__ == "__main__":
    run_migration()

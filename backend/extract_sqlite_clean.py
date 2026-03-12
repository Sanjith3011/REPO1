import sqlite3

conn = sqlite3.connect('db.sqlite3')
cur = conn.cursor()

query = """
SELECT assessment_student.roll_no, assessment_student.name
FROM assessment_student
INNER JOIN assessment_batch ON assessment_student.batch_id = assessment_batch.id
WHERE assessment_batch.year_start = 2024 AND assessment_batch.year_end = 2028
ORDER BY assessment_student.roll_no;
"""

cur.execute(query)
rows = cur.fetchall()

with open('students_2024_2028_clean.txt', 'w', encoding='utf-8') as f:
    if not rows:
        f.write("No students found for the 2024-2028 batch.\n")
    else:
        for row in rows:
            f.write(f"{row[0]}, {row[1]}\n")

conn.close()

import faiss
import sqlite3
import numpy as np
import pickle

DB_PATH = "face_embeddings.db"
FAISS_PATH = "face_embeddings.faiss"

# 1) Load embeddings from SQLite
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()
cursor.execute("SELECT id, label, descriptor FROM embeddings ORDER BY id ASC")
rows = cursor.fetchall()
conn.close()

embedding_dim = 128
num_embeddings = len(rows)
print(f"Found {num_embeddings} embeddings in the database.")

# 2) Prepare NumPy array and label dict
data = np.zeros((num_embeddings, embedding_dim), dtype=np.float32)
id_to_label = {}

for faiss_index, (db_id, label, blob) in enumerate(rows):
    data[faiss_index] = np.frombuffer(blob, dtype=np.float32)
    id_to_label[faiss_index] = label

# 3) Create an IVF index for faster search on large datasets
#
# nlist = 100 is a decent default for moderate dataset sizes.
# Larger datasets can benefit from bigger nlist (e.g. 1000, 2000, etc.).
nlist = 100
quantizer = faiss.IndexFlatL2(embedding_dim)  
index = faiss.IndexIVFFlat(quantizer, embedding_dim, nlist, faiss.METRIC_L2)

# 4) Train the IVF index on your data
index.train(data)

# 5) Add embeddings
index.add(data)

# 6) Write out the index to disk
faiss.write_index(index, FAISS_PATH)

# 7) Save label mappings
with open(FAISS_PATH.replace(".faiss", "_labels.pkl"), "wb") as f:
    pickle.dump(id_to_label, f)

print("🎉 FAISS Index successfully saved (using IVF).")


# import json
# import sqlite3
# import numpy as np

# # Paths
# JSON_FILE = "descriptors.json"  # Change this to your actual JSON file
# DB_PATH = "face_embeddings.db"

# # ✅ Load JSON Data
# with open(JSON_FILE, "r") as f:
#     data = json.load(f)

# # ✅ Initialize SQLite DB
# conn = sqlite3.connect(DB_PATH)
# cursor = conn.cursor()

# # ✅ Create Table if it Doesn't Exist
# cursor.execute("""
#     CREATE TABLE IF NOT EXISTS embeddings (
#         id INTEGER PRIMARY KEY AUTOINCREMENT,
#         label TEXT NOT NULL,
#         descriptor BLOB NOT NULL
#     )
# """)

# # ✅ Insert Descriptors into SQLite
# def insert_descriptors(label, descriptors):
#     """Insert multiple descriptors for the same label into SQLite DB."""
#     for descriptor in descriptors:
#         descriptor_blob = np.array(descriptor, dtype=np.float32).tobytes()
#         cursor.execute("INSERT INTO embeddings (label, descriptor) VALUES (?, ?)", (label, descriptor_blob))

# # ✅ Process JSON and Insert
# for label, entry in data.items():
#     descriptors = entry.get("descriptors", [])
#     if descriptors:
#         insert_descriptors(label, descriptors)

# # ✅ Commit and Close DB
# conn.commit()
# conn.close()

# print("🎉 JSON data successfully inserted into face_embeddings.db!")

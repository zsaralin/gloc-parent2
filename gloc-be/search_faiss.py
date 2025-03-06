import sys
import json
import faiss
import numpy as np
import pickle

FAISS_PATH = "face_embeddings.faiss"

# ✅ Load FAISS Index
index = faiss.read_index(FAISS_PATH)

# ✅ Load FAISS Label Mapping
with open(FAISS_PATH.replace(".faiss", "_labels.pkl"), "rb") as f:
    id_to_label = pickle.load(f)

def search_faiss(target_descriptor, top_k):
    """Finds closest matches using an IVF-based FAISS index (approx nearest neighbors)."""
    query = np.expand_dims(np.array(target_descriptor, dtype=np.float32), axis=0)

    # For IVF-based indexes, 'nprobe' controls how many inverted lists to search.
    # Typically, 1 <= nprobe <= nlist. Higher = better accuracy, slower speed.
    index.nprobe = 10

    # 🔎 Perform the search
    distances, indices = index.search(query, top_k)

    # Collect results
    results = []
    for i, idx in enumerate(indices[0]):
        
        label = id_to_label.get(idx, "Unknown")
        distance = float(distances[0][i])
        results.append({"label": label, "distance": distance})

    return results

if __name__ == "__main__":
    # Read num_matches from CLI arg (defaults to 5)
    if len(sys.argv) > 1:
        try:
            num_matches = int(sys.argv[1])
        except ValueError:
            print(json.dumps({"error": "Invalid num_matches value"}))
            sys.exit(1)
    else:
        num_matches = 5

    # Read target descriptor from stdin
    raw_descriptor = sys.stdin.read().strip()
    if not raw_descriptor:
        print(json.dumps({"error": "No input received"}))
        sys.exit(1)

    # Convert JSON -> Python list/array
    try:
        target_descriptor = json.loads(raw_descriptor)
        top_matches = search_faiss(target_descriptor, num_matches)
        print(json.dumps(top_matches, indent=2))
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON input: {str(e)}"}))
        sys.exit(1)

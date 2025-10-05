from sentence_transformers import SentenceTransformer
import umap
from sklearn.neighbors import NearestNeighbors
import numpy as np

def process_data_with_ai(articles_data):
    """
    Processes the fetched data using AI models to generate embeddings, 
    3D coordinates, and nearest neighbors.

    Args:
        articles_data (list): A list of article dictionaries from the data_collector.

    Returns:
        list: The same list, but with new keys for embeddings, coordinates, and neighbors.
    """
    print("\nStarting AI processing...")
    
    # 1. Load the AI Model
    print("Step 1/4: Loading SentenceTransformer model (all-MiniLM-L6-v2)...")
    model = SentenceTransformer('all-MiniLM-L6-v2')

    # 2. Generate Embeddings
    # We will generate embeddings for the 'summary' of each article
    summaries = [article['summary'] for article in articles_data]
    print(f"Step 2/4: Generating embeddings for {len(summaries)} articles...")
    embeddings = model.encode(summaries, show_progress_bar=True)
    print("Embeddings generated successfully.")

    # 3. Reduce Dimensions with UMAP
    print("Step 3/4: Reducing dimensions to 3D with UMAP...")
    reducer = umap.UMAP(n_components=3, random_state=42, n_neighbors=15, min_dist=0.1)
    coords_3d = reducer.fit_transform(embeddings)
    print("3D coordinates generated.")

    # 4. Find Nearest Neighbors
    print("Step 4/4: Finding nearest neighbors...")
    # We look for 6 neighbors because the first neighbor is always the point itself
    nn = NearestNeighbors(n_neighbors=6, metric='cosine')
    nn.fit(embeddings)
    distances, indices = nn.kneighbors(embeddings)
    print("Nearest neighbors found.")
    
    # Add the new data back to our original list
    for i, article in enumerate(articles_data):
        # We don't need to store the full high-dimensional embedding in the final JSON
        # article['embedding'] = embeddings[i].tolist() 
        article['position'] = coords_3d[i].tolist()
        
        # Get neighbor IDs (we skip the first one, which is the article itself)
        neighbor_indices = indices[i][1:]
        neighbor_ids = [articles_data[n_idx]['id'] for n_idx in neighbor_indices]
        article['neighbors'] = neighbor_ids
        
    print("\nAI processing complete!")
    return articles_data
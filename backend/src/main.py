import json
from data_collector import get_wiki_summaries
from embedding_generator import process_data_with_ai

def main():
    """
    The main function to run the entire data processing pipeline.
    """
    print("--- Starting The Weaver Backend Pipeline ---")
    
    # Define topics and number of articles for data collection
    space_topics = ["Astrophysics", "Black_holes", "Galaxies", "Nebulae", "Cosmology", "Supernova", "Exoplanet"]
    total_articles_to_fetch = 500 # Let's aim for 500 for a good-sized graph
    
    # --- Part 1: Collect Data ---
    articles = get_wiki_summaries(space_topics, max_articles=total_articles_to_fetch)
    
    if not articles:
        print("No articles were fetched. Exiting pipeline.")
        return

    # --- Part 2: Process Data with AI ---
    processed_articles = process_data_with_ai(articles)
    
    # --- Part 3: Save the Final Output ---
    # We will create a final JSON structure that is optimized for the frontend
    final_output = {
        "nodes": [],
    }
    
    for article in processed_articles:
        # We don't need all the data in the final file, just what the frontend needs
        final_output["nodes"].append({
            "id": article['id'],
            "label": article['title'],
            "summary": article['summary'],
            "position": article['position'],
            "neighbors": article['neighbors']
        })
        
    output_path = 'output/space_data.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=4, ensure_ascii=False)
        
    print(f"\n--- Pipeline Complete! ---")
    print(f"Final data successfully saved to: {output_path}")
    print("You can now copy this file to your frontend's 'public' directory.")

if __name__ == '__main__':
    main()
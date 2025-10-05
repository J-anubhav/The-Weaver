import wikipediaapi
import json

def get_wiki_summaries(categories, max_articles=100):
    """
    Fetches summaries of Wikipedia articles from a list of categories.

    Args:
        categories (list): A list of strings, where each string is a category to search for.
        max_articles (int): The maximum number of articles to fetch in total.

    Returns:
        list: A list of dictionaries, where each dictionary contains the title and summary of an article.
    """
    # Initialize the Wikipedia API with a custom user agent
    wiki_wiki = wikipediaapi.Wikipedia(
        language='en',
        user_agent='TheWeaver/1.0 (the.weaver.project@example.com)'
    )

    articles_data = []
    fetched_titles = set()
    
    print(f"Starting to fetch articles for categories: {categories}")

    for category in categories:
        if len(articles_data) >= max_articles:
            break
        
        # Get all pages in the category
        cat_page = wiki_wiki.page(f"Category:{category}")
        
        if not cat_page.exists():
            print(f"Warning: Category '{category}' does not exist. Skipping.")
            continue

        # We limit to 20 pages per category to get a good variety
        for page in list(cat_page.categorymembers.values())[:20]:
            if len(articles_data) >= max_articles:
                break
            
            # Avoid duplicates and pages that are not articles
            if page.title not in fetched_titles and page.namespace == 0:
                print(f"  Fetching: {page.title}")
                articles_data.append({
                    'id': page.title.replace(" ", "_").lower(),
                    'title': page.title,
                    'summary': page.summary[0:500] + '...' if len(page.summary) > 500 else page.summary, # Get first 500 chars
                    'url': page.fullurl
                })
                fetched_titles.add(page.title)

    print(f"\nFetched {len(articles_data)} unique articles.")
    return articles_data

# This block allows us to test this file directly
if __name__ == '__main__':
    space_topics = ["Astrophysics", "Black_holes", "Galaxies", "Nebulae", "Cosmology", "Space"]
    
    # Fetch data
    fetched_data = get_wiki_summaries(space_topics, max_articles=50) # Let's fetch 50 for a quick test
    
    # Save it to a temporary JSON file to check the output
    if fetched_data:
        with open('temp_wiki_output.json', 'w', encoding='utf-8') as f:
            json.dump(fetched_data, f, indent=4, ensure_ascii=False)
        print("\nSuccessfully saved test data to 'temp_wiki_output.json'")
        print("You can open this file to see what the script fetched.")
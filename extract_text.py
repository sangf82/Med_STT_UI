import json
import sys
import os

def find_text_nodes(node, results=None):
    if results is None:
        results = []
    if isinstance(node, dict):
        if node.get('type') == 'text' and 'content' in node:
            results.append((node['id'], node['content']))
        children = node.get('children')
        if isinstance(children, list):
            for child in children:
                find_text_nodes(child, results)
    return results

def process_json_file(json_path, output_file=None):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    lines = []
    for screen in data:
        screen_id = screen.get('id', '?')
        screen_name = screen.get('name', '?')
        lines.append(f'SCREEN: {screen_name} ({screen_id})')
        text_nodes = find_text_nodes(screen)
        for nid, content in text_nodes:
            lines.append(f'- {nid}: "{content}"')
        lines.append('')
    
    output = '\n'.join(lines)
    if output_file:
        with open(output_file, 'a', encoding='utf-8') as f:
            f.write(output + '\n')
    print(output)

if __name__ == '__main__':
    json_path = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    process_json_file(json_path, output_file)

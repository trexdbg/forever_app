"""Offline projection of reviewed Forever profession HTML; no network/publishing."""
import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re

BUILD = '1.60.1.70425'
SOURCES = {
    'parts': (202, 'Engineering', 'https://wowforevertalents.com/professions/engineering/parts/'),
    'explosives': (202, 'Engineering', 'https://wowforevertalents.com/professions/engineering/explosives/'),
    'first-aid': (129, 'First Aid', 'https://wowforevertalents.com/professions/first-aid/'),
}


class Node:
    def __init__(self, tag='', attrs=()):
        self.tag, self.attrs, self.children = tag, dict(attrs), []

    def has(self, name):
        return name in self.attrs.get('class', '').split()

    def all(self, predicate):
        found = [self] if predicate(self) else []
        for child in self.children:
            if isinstance(child, Node):
                found.extend(child.all(predicate))
        return found

    def one(self, cls):
        matches = self.all(lambda n: n.has(cls))
        if len(matches) != 1:
            raise ValueError(f'Expected one {cls}, got {len(matches)}')
        return matches[0]

    def text(self):
        return ''.join(c.text() if isinstance(c, Node) else c for c in self.children)


class Tree(HTMLParser):
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node()
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = Node(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in self.VOID:
            self.stack.append(node)

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                return

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.handle_endtag(tag)

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def number(value):
    if value is None or value == '':
        return None
    if not re.fullmatch(r'\d+', value):
        raise ValueError(f'Non-integer source value: {value!r}')
    return int(value)


def item_id(link):
    match = re.search(r'^https://www\.wowhead\.com/(?:forever|classic)/item=(\d+)(?:[/?#]|$)', link)
    if not match:
        raise ValueError(f'Unresolved item ID: {link}')
    return int(match[1])


def extract(html, source_key, observed_at):
    profession_id, profession, url = SOURCES[source_key]
    tree = Tree()
    tree.feed(html)
    if BUILD not in tree.root.text():
        raise ValueError('Reviewed source build not found')
    window = tree.root.one('pw')
    if window.attrs.get('data-name') != profession:
        raise ValueError('Unexpected source profession')
    result = []
    for row in window.all(lambda n: n.has('pw-row')):
        a = row.attrs
        yellow = number(a.get('data-yellow'))
        if yellow is None or not 1 <= yellow <= 150 or a.get('data-status') == 'removed':
            continue
        spell = number(a.get('data-r'))
        if not spell or row.attrs.get('id') != f'r-{spell}':
            raise ValueError('Source spell/anchor mismatch')
        name_node = row.one('rd-name')
        name_link = name_node.all(lambda n: n.tag == 'a')
        if len(name_link) != 1:
            raise ValueError('Ambiguous output identity')
        link = name_link[0]
        sub = row.one('rd-sub').text()
        level = re.search(r'Item level (\d+)', sub)
        makes = re.search(r'Makes (\d+)(?![\d–-])(?:\s|$)', sub)
        if not level or not makes or int(makes[1]) < 1:
            raise ValueError(f'Output quantity or level not explicit: {spell} / {sub}')
        ingredients = []
        for li in row.one('rd-reagents').all(lambda n: n.tag == 'li'):
            links = li.all(lambda n: n.tag == 'a')
            if len(links) != 1:
                raise ValueError('Ambiguous reagent identity')
            ingredients.append({'item_id':item_id(links[0].attrs['href']),
                'name_en':li.one('rd-reagent-name').text().strip(),
                'quantity':number(li.one('rd-count').text().strip())})
        books = []
        for teachers in row.all(lambda n: n.has('rd-teachers')):
            for book in teachers.all(lambda n: n.tag == 'a'):
                books.append(item_id(book.attrs['href']))
        learning = number(a.get('data-learn'))
        kind = a.get('data-src')
        if kind not in ('trainer', 'item') or not ingredients or any(not i['quantity'] for i in ingredients):
            raise ValueError(f'Incomplete recipe: {spell}')
        result.append({
            'spell_id':spell, 'profession_id':profession_id, 'profession_en':profession,
            'name_en':link.text().strip(), 'name_fr':None,
            'source_classic_comparison_status':a.get('data-status'),
            'output':{'item_id':item_id(link.attrs['href']), 'name_en':link.text().strip(),
                'item_level_reported':int(level[1]), 'quantity_reported':int(makes[1]),
                'player_level_required':None, 'verified_live_yield':None},
            'ingredients':ingredients, 'book_item_ids':books,
            'learning_method_reported':kind, 'learning_skill_reported':learning,
            'learning_skill_status':'client_requirement_reported_by_source' if learning is not None else 'trainer_requirement_not_in_source_client',
            'skill_yellow_reported':yellow, 'skill_green_reported':number(a.get('data-green')),
            'skill_grey_reported':number(a.get('data-grey')),
            'green_threshold_status':'source_calculated_midpoint_not_independently_extracted',
            'availability_in_game':None,
            'evidence_level':'documented_forever', 'source_url':url, 'evidence_url':url + f'#r-{spell}',
            'observed_at':observed_at, 'observed_build':BUILD, 'evidence_kind':'forever_community_page',
            'evidence_note':'WoW Forever Talents publishes this exact spell, output, ingredients, colour thresholds and linked recipe items for build 1.60.1.70425. This is a community presentation of client data, not an independently decoded DB2 export or an observed craft. The source calculates green as the rounded midpoint of yellow/grey; unknown server trainer requirements, live yield, vendors and availability are not inferred.',
        })
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for key in SOURCES:
        parser.add_argument('--' + key, type=Path, required=True)
    parser.add_argument('--observed-at', required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    from datetime import date
    date.fromisoformat(args.observed_at)
    recipes, sources = [], []
    for key, (_, _, url) in SOURCES.items():
        raw = getattr(args, key.replace('-', '_')).read_bytes()
        rows = extract(raw.decode('utf-8'), key, args.observed_at)
        recipes.extend(rows)
        sources.append({'source_url':url,'observed_at':args.observed_at,'observed_build':BUILD,
            'html_sha256':hashlib.sha256(raw).hexdigest(),'selected_recipes':len(rows)})
    if len({r['spell_id'] for r in recipes}) != len(recipes):
        raise ValueError('Duplicate spell across reviewed sources')
    output = {'schema_version':1,'observed_build':BUILD,'observed_at':args.observed_at,
        'scope':'Three reviewed profession pages, yellow skill threshold 1..150; no proof of character-level-30 availability. Independent documentary snapshots; historic archive retained.',
        'sources':sources,'counts':{'recipes':len(recipes),'ingredient_edges':sum(len(r['ingredients']) for r in recipes)},
        'recipes':sorted(recipes,key=lambda r:(r['profession_id'],r['spell_id']))}
    args.output.write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(output['counts']))


if __name__ == '__main__':
    main()

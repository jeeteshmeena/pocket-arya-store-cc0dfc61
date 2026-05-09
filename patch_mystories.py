import re

with open('src/components/arya/views/MyStoriesView.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace setSelected(s) with navigate(...)
content = content.replace('setSelected(s)', 'navigate({ name: "purchased-detail", storyId: s.story_id })')

# 2. Remove selected state (just comment it out to be safe)
content = content.replace('const [selected, setSelected] = useState<PurchasedStory | null>(null);', '// const [selected, setSelected] = useState<PurchasedStory | null>(null);')

# 3. Remove PurchasedDetailSheet render (comment it out)
render_block = '''      {/* Detail bottom sheet */}
      {selected && (
        <PurchasedDetailSheet story={selected} onClose={() => setSelected(null)} />
      )}'''
content = content.replace(render_block, '')

with open('src/components/arya/views/MyStoriesView.tsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print('Success')

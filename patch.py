import re

with open('src/components/arya/InfoDialog.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

with open('contact_patch.txt', 'r', encoding='utf-8') as f:
    new_block = f.read()

start_str = ') : current === "contact" ? ('
start_idx = content.find(start_str)
if start_idx != -1:
    end_idx = content.find(') : (', start_idx)
    if end_idx != -1:
        content = content[:start_idx] + new_block + content[end_idx + 5:]
        with open('src/components/arya/InfoDialog.tsx', 'w', encoding='utf-8', newline='\n') as f:
            f.write(content)
        print('Success')
    else:
        print('End not found')
else:
    print('Start not found')

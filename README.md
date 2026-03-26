## Can AI replace SaaS? Vibecoding premium features into freemium FOSS on labelstudio.

### Feat Test 1: Workspaces [Target: Premium]
<img width="2879" height="1220" alt="image" src="https://github.com/user-attachments/assets/95023d1d-2cc2-4e91-9a9f-27418c35696f" />
<img width="2879" height="1522" alt="image" src="https://github.com/user-attachments/assets/c2d237ee-f83d-4f89-865f-05f87a7e87d2" />

Used tokens (BASE): 25k, Sonnet 4.6
- Fix 1: 8k tokens; editing the name and description of workspace did not work
- Fix 2: 4k tokens; add the Recent Workspaces onto the frontend

### Feat Test 2: Advanced Sampling [Target: Custom]
<img width="1271" height="1273" alt="image" src="https://github.com/user-attachments/assets/6df75bec-4a2d-428f-aa2a-58b7f8cd7935" />

Used tokens: 20k (BASE), Sonnet 4.6
- Fix 1: 7k tokens; not following the theme
- Fix 2: 4k tokens; input is not dropdown (it should come from existing columns, and also did not follow match the theme.

### Feat Test 3: Merge Tasks
<img width="768" height="1133" alt="image" src="https://github.com/user-attachments/assets/0c0e15e0-fd92-4c5c-9f46-6d37ddab99c1" />

Used Tokens: 15k (BASE), Sonnet 4.6.
- One-shotted.

### To be tested features
- Mobile view for annotating on a phone (completely new)
- Parquet Import (premium)

## Running Locally
```
git clone https://github.com/mzen17/LBS-VC.git
uv run label_studio/manage.py migrate
uv run label_studio/manage.py collectstatic
cd web
bun i
bun run build
cd ..
uv run label_studio/manage.py runserver 0.0.0.0:8333
```

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1OPCY7VqXVDGd8k4tAwhpGHXj6BRaDCt6

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `OPENAI_API_KEY` in [.env.local](.env.local) to your OpenAI API key
3. Run the app:
   `npm run dev`

## Docker

Build and run the production bundle with Docker (API key is baked at build time):

```bash
docker build --build-arg OPENAI_API_KEY=your_key_here -t iztro-zwds .
docker run --rm -p 8080:80 iztro-zwds
```

Or use Docker Compose:

```bash
OPENAI_API_KEY=your_key_here docker compose up --build
```

<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1Mymikt_aeX4dqCm2wQj8ja2W_gLD5HsO

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Beta Features

Image carousels in the detail modal are available as an opt-in beta feature. To experiment with them locally:

1. Check out the `Beta` branch: `git checkout Beta`
2. Enable the flag by setting `VITE_ENABLE_MODAL_IMAGE_BETA=true` in your environment (e.g., add it to `.env.local`).
3. Run the development server (`npm run dev`) and open a title to view the additional image carousels.

The beta branch can be merged into other branches whenever you want to include the experiment.

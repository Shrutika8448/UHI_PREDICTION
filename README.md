# CityCare - AI-Powered Environmental Risk Prediction 🌍🌿


**CityCare** is a full-stack, AI-driven climate risk intelligence platform designed to monitor, predict, and mitigate local environmental hazards like the Urban Heat Island (UHI) effect. By leveraging real-time data and artificial intelligence, CityCare aims to build smarter, more resilient cities worldwide.

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" height="25" alt="React">
  <img src="https://img.shields.io/badge/Python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54" height="25" alt="Python">
  <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" height="25" alt="Flask">
  <img src="https://img.shields.io/badge/Google%20Cloud-4285F4?style=for-the-badge&logo=google-cloud&logoColor=white" height="25" alt="Google Cloud">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" height="25" alt="Docker">
  <img src="https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" height="25" alt="Google Gemini">
  <img src="https://img.shields.io/badge/XGBoost-1572B6?style=for-the-badge&logo=scikit-learn&logoColor=white" height="25" alt="XGBoost">
  <img src="https://img.shields.io/badge/Earth%20Engine-34A853?style=for-the-badge&logo=googleearth&logoColor=white" height="25" alt="Google Earth Engine">
</p>

---

## 🚀 Live Demo
**Deployed on Google Cloud Run:** [https://climateriskai-502583370638.asia-south1.run.app/](https://climateriskai-502583370638.asia-south1.run.app/)

## ✨ Features

- **📊 Interactive City Analytics:** A real-time dashboard powered by Recharts that visualizes critical metrics such as:
  - Average Heat Risk Scores
  - Green Deficit Percentages
  - Exposed Vulnerable Populations
  - Urban Resilience Indexes
- **🗺️ Predictive Urban Heat Maps:** High-resolution embedded Folium heatmaps powered by real-time coordinates, displaying both Current Risk Density and an AI-driven 3-Month Risk Projection.
- **🤖 Climate AI Assistant:** An integrated chatbot utilizing the **Google Gemini 2.5 Flash** model. It understands context from your backend data and can answer questions like *"Which are the top 10 high-risk localities in Pune?"* or *"What mitigation strategies reduce risk right now?"*
- **🚨 Critical Zone Alerts:** Automatic identification of localities reading extreme Heat Risk Scores (> 60), alerting users to take immediate action.
- **📱 Fully Responsive Design:** A modern, glassmorphic UI layout that works seamlessly across desktops, tablets, and mobile devices.

## 🛠️ Technology Stack

**Frontend:**
- **React.js** (Functional Components, React Router DOM)
- **Recharts** for complex charting and scatter plots.
- **Vanilla CSS** with powerful media queries and animations for UX.
- **@google/generative-ai** for frontend direct AI chat integration.

**Backend & Machine Learning:**
- **Python / Flask** (REST API generating real-time city statistics and rankings).
- **Google Earth Engine (GEE)** for extracting live remote sensing features (NDVI, NDBI, Albedo, etc.).
- **XGBoost (XGBRegressor)** for predictive modeling of Land Surface Temperature (LST) and heat risk scoring.
- Containerized via **Docker**.
- Deployed on **Google Cloud Run (GCP)** for scalable and continuous availability.

## ⚙️ Local Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/iamarshiya/UHI_PREDICTION.git
   cd UHI_PREDICTION
   ```

2. **Start the Python Backend:**
   *(Ensure you have Python 3 installed)*
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python app.py  # Usually runs on localhost:5001
   ```

3. **Configure Frontend Environment Variables:**
   Create a `.env` file in the `/frontend` directory:
   ```env
   REACT_APP_API_URL=http://localhost:5001
   REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the React Frontend:**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   The application will run on `http://localhost:3000`.

## 🤝 Contributors
 [Nasreen Nadaf](https://www.linkedin.com/in/nasreen-nadaf-2b0973368/)
 [Shrutika Newaskar](https://www.linkedin.com/in/nasreen-nadaf-2b0973368/)

## 📜 License
This project is licensed under the MIT License.

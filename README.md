
# Project Deployment Instructions

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (version 14.x or higher)
- [npm](https://www.npmjs.com/) (version 6.x or higher)
- [MongoDB](https://www.mongodb.com/) (Ensure MongoDB is running)

## Environment Variables

Create a `.env` file in the root directory of your project and add the following environment variables:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/your-database-name
SESSION_SECRET=your-session-secret
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
MOMO_PARTNER_CODE=your-momo-partner-code
MOMO_ACCESS_KEY=your-momo-access-key
MOMO_SECRET_KEY=your-momo-secret-key
VNPAY_TMN_CODE=your-vnpay-tmn-code
VNPAY_HASH_SECRET=your-vnpay-hash-secret
VNPAY_URL=your-vnpay-url
VNPAY_RETURN_URL=your-vnpay-return-url
```
## Installation

1. Clone the repository:

```sh
git clone https://github.com/Keruedu/WEB-FinalProject-2024
cd your-repository
```

2. Install the dependencies:
```sh
npm install
```
3. Build the CSS:
```sh
npm run build-css
```
## Database Setup
Run the migration scripts to set up the database:
```sh
node database/migrations/dropDatabase.js
node database/seed_data/seed.js
```
## Running the Application
1. Run the migration scripts to set up the database:
```sh
npm start
```
2. Open your browser and navigate to http://localhost:3000.

# Deployment on Render

To deploy the application on Render, follow these steps:

1. **Create a Render Account**:
   - Go to [Render](https://render.com/) and sign up for an account.

2. **Create a New Web Service**:
   - Click on the "New" button and select "Web Service".
   - Connect your GitHub repository to Render.
   - Select the repository you want to deploy.

3. **Configure the Web Service**:
   - **Name**: Choose a name for your service.
   - **Region**: Select the region closest to your users.
   - **Branch**: Select the branch you want to deploy (e.g., `main`).
   - **Build Command**: Set the build command to:
     ```sh
     npm install && npm run build-css
     ```
   - **Start Command**: Set the start command to:
     ```sh
     npm start
     ```

4. **Set Environment Variables**:
   - Add the environment variables listed in your [.env](http://_vscodecontentref_/0) file to the Render environment variables section. This includes:
     ```env
     PORT=3000
     MONGO_URI=mongodb://<your-mongo-uri>
     SESSION_SECRET=your-session-secret
     CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
     CLOUDINARY_API_KEY=your-cloudinary-api-key
     CLOUDINARY_API_SECRET=your-cloudinary-api-secret
     MOMO_PARTNER_CODE=your-momo-partner-code
     MOMO_ACCESS_KEY=your-momo-access-key
     MOMO_SECRET_KEY=your-momo-secret-key
     VNPAY_TMN_CODE=your-vnpay-tmn-code
     VNPAY_HASH_SECRET=your-vnpay-hash-secret
     VNPAY_URL=your-vnpay-url
     VNPAY_RETURN_URL=your-vnpay-return-url
     ```

5. **Deploy the Service**:
   - Click on the "Create Web Service" button to start the deployment process.
   - Render will automatically build and deploy your application.

6. **Monitor the Deployment**:
   - You can monitor the deployment logs in the Render dashboard.
   - Once the deployment is complete, Render will provide a URL where your application is accessible.

7. **Database Setup**:
   - Ensure your MongoDB instance is accessible from Render.
   - If using a managed MongoDB service like MongoDB Atlas, whitelist Render's IP addresses.

8. **Additional Configuration**:
   - Configure your domain and SSL (if applicable) in the Render dashboard.

For any issues or questions, please refer to the [Render documentation](https://render.com/docs) or the [issue tracker](https://github.com/Keruedu/WEB-FinalProject-2024/issues) on GitHub.

cd auth-api-rest;
npm install;
cd ../events-api-rest;
npm install;
cd ../logs-api-rest;
npm install;
cd ../suppliers-api-rest;
npm install;
cd ../suppliers-products-mock;
npm install;
cd ../transactions-api-rest;
npm install;
cd ..;
docker-compose up --build;
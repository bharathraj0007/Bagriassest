import * as tf from '@tensorflow/tfjs';
import { writeFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CROPS = [
  { id: 0, name: 'Rice', optimal_ph_min: 5.5, optimal_ph_max: 7.0, optimal_temp_min: 20, optimal_temp_max: 35, optimal_humidity_min: 70, optimal_humidity_max: 90, optimal_rainfall_min: 1000, optimal_rainfall_max: 2500, soil_type: 1, season: 0 },
  { id: 1, name: 'Wheat', optimal_ph_min: 6.0, optimal_ph_max: 7.5, optimal_temp_min: 12, optimal_temp_max: 25, optimal_humidity_min: 50, optimal_humidity_max: 70, optimal_rainfall_min: 400, optimal_rainfall_max: 800, soil_type: 1, season: 1 },
  { id: 2, name: 'Cotton', optimal_ph_min: 5.8, optimal_ph_max: 8.0, optimal_temp_min: 21, optimal_temp_max: 30, optimal_humidity_min: 60, optimal_humidity_max: 80, optimal_rainfall_min: 500, optimal_rainfall_max: 1200, soil_type: 3, season: 0 },
  { id: 3, name: 'Sugarcane', optimal_ph_min: 6.0, optimal_ph_max: 7.5, optimal_temp_min: 20, optimal_temp_max: 35, optimal_humidity_min: 70, optimal_humidity_max: 90, optimal_rainfall_min: 1500, optimal_rainfall_max: 2500, soil_type: 1, season: 2 },
  { id: 4, name: 'Maize', optimal_ph_min: 5.8, optimal_ph_max: 7.0, optimal_temp_min: 18, optimal_temp_max: 32, optimal_humidity_min: 60, optimal_humidity_max: 80, optimal_rainfall_min: 500, optimal_rainfall_max: 1000, soil_type: 1, season: 0 },
  { id: 5, name: 'Soybean', optimal_ph_min: 6.0, optimal_ph_max: 7.0, optimal_temp_min: 20, optimal_temp_max: 30, optimal_humidity_min: 65, optimal_humidity_max: 85, optimal_rainfall_min: 600, optimal_rainfall_max: 1200, soil_type: 3, season: 0 },
  { id: 6, name: 'Potato', optimal_ph_min: 5.0, optimal_ph_max: 6.5, optimal_temp_min: 15, optimal_temp_max: 25, optimal_humidity_min: 60, optimal_humidity_max: 80, optimal_rainfall_min: 500, optimal_rainfall_max: 800, soil_type: 5, season: 1 },
  { id: 7, name: 'Tomato', optimal_ph_min: 6.0, optimal_ph_max: 7.0, optimal_temp_min: 18, optimal_temp_max: 27, optimal_humidity_min: 60, optimal_humidity_max: 80, optimal_rainfall_min: 400, optimal_rainfall_max: 700, soil_type: 1, season: 2 },
];

function generateSyntheticData(numSamples = 5000) {
  const features = [];
  const labels = [];

  for (let i = 0; i < numSamples; i++) {
    const crop = CROPS[Math.floor(Math.random() * CROPS.length)];

    const soilPh = crop.optimal_ph_min + Math.random() * (crop.optimal_ph_max - crop.optimal_ph_min);
    const temperature = crop.optimal_temp_min + Math.random() * (crop.optimal_temp_max - crop.optimal_temp_min);
    const humidity = crop.optimal_humidity_min + Math.random() * (crop.optimal_humidity_max - crop.optimal_humidity_min);
    const rainfall = crop.optimal_rainfall_min + Math.random() * (crop.optimal_rainfall_max - crop.optimal_rainfall_min);
    const soilType = crop.soil_type;
    const season = crop.season;

    features.push([
      soilPh / 14,
      temperature / 50,
      humidity / 100,
      rainfall / 2500,
      soilType / 6,
      season / 3,
    ]);

    labels.push(crop.id);
  }

  return { features, labels };
}

async function trainModel() {
  console.log('Generating synthetic training data...');
  const { features, labels } = generateSyntheticData(5000);

  const featuresTensor = tf.tensor2d(features);
  const labelsTensor = tf.tensor1d(labels, 'int32');
  const labelsOneHot = tf.oneHot(labelsTensor, CROPS.length);

  console.log('Building neural network model...');
  const model = tf.sequential({
    layers: [
      tf.layers.dense({
        inputShape: [6],
        units: 128,
        activation: 'relu',
      }),
      tf.layers.dropout({ rate: 0.3 }),
      tf.layers.dense({
        units: 64,
        activation: 'relu',
      }),
      tf.layers.dropout({ rate: 0.3 }),
      tf.layers.dense({
        units: 32,
        activation: 'relu',
      }),
      tf.layers.dense({
        units: CROPS.length,
        activation: 'softmax',
      }),
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'categoricalCrossentropy',
    metrics: ['accuracy'],
  });

  console.log('Training model...');
  await model.fit(featuresTensor, labelsOneHot, {
    epochs: 100,
    batchSize: 32,
    verbose: 1,
    shuffle: true,
    validationSplit: 0.2,
  });

  console.log('Saving model...');
  await model.save(`file://${__dirname}/supabase/functions/crop-recommendation/model`);

  console.log('Model trained and saved successfully!');
  featuresTensor.dispose();
  labelsTensor.dispose();
  labelsOneHot.dispose();
  model.dispose();
}

trainModel().catch(console.error);

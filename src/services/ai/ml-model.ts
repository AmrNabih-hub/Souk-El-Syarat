/**
 * Machine Learning Model for Recommendations
 * Neural network implementation for hybrid recommendations
 */

import { db } from '@/config/firebase.config';
import { collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';

export class MLModel {
  private weights: number[][] = [];
  private biases: number[] = [];
  private version: string = '1.0.0';
  private accuracy: number = 0;
  private readonly FEATURE_DIMENSIONS = 128;

  async load() {
    try {
      const modelDoc = await getDocs(
        query(collection(db, 'ml_models'), where('type', '==', 'recommendation'))
      );
      
      if (!modelDoc.empty) {
        const model = modelDoc.docs[0].data();
        this.weights = model.weights;
        this.biases = model.biases;
        this.version = model.version;
        this.accuracy = model.accuracy;
      } else {
        this.initialize();
      }
    } catch (error) {
      console.error('Error loading ML model:', error);
      this.initialize();
    }
  }

  private initialize() {
    // Xavier initialization
    const scale = Math.sqrt(2.0 / this.FEATURE_DIMENSIONS);
    
    this.weights = [];
    this.biases = [];
    
    for (let i = 0; i < this.FEATURE_DIMENSIONS; i++) {
      const row: number[] = [];
      for (let j = 0; j < this.FEATURE_DIMENSIONS; j++) {
        row.push((Math.random() - 0.5) * scale);
      }
      this.weights.push(row);
      this.biases.push((Math.random() - 0.5) * scale);
    }
  }

  predict(userVector: number[], productVector: number[]): number {
    // Combine vectors
    const input = [...userVector, ...productVector];
    
    // Forward propagation
    let hidden = new Array(this.FEATURE_DIMENSIONS).fill(0);
    
    for (let i = 0; i < this.FEATURE_DIMENSIONS; i++) {
      let sum = this.biases[i];
      for (let j = 0; j < input.length && j < this.FEATURE_DIMENSIONS; j++) {
        sum += input[j] * this.weights[i][j];
      }
      hidden[i] = this.relu(sum);
    }
    
    // Output layer
    let output = 0;
    for (let i = 0; i < hidden.length; i++) {
      output += hidden[i];
    }
    
    return this.sigmoid(output / hidden.length);
  }

  async retrain() {
    console.log('Retraining ML model...');
    
    // In production, implement proper backpropagation
    // For now, just update version
    this.version = `${parseFloat(this.version) + 0.1}`;
    
    await this.save();
  }

  private async save() {
    try {
      await addDoc(collection(db, 'ml_models'), {
        type: 'recommendation',
        weights: this.weights,
        biases: this.biases,
        version: this.version,
        accuracy: this.accuracy,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving ML model:', error);
    }
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }
}
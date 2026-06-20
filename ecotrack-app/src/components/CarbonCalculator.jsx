import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { calculateCarbonFootprint } from '../services/carbonCalculator';
import { calculateEcoScore } from '../services/ecoScoreCalculator';
import { saveActivityLog } from '../services/firebaseService';

function CarbonCalculator() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  
  const [formData, setFormData] = useState({
    transport: {
      mode: 'car',
      distance: 0,
    },
    electricity: {
      usage: 0,
    },
    food: {
      meatConsumption: 'medium',
      localProduce: false,
      foodWaste: 'medium',
    },
    shopping: {
      newClothes: 0,
      electronics: 0,
      recycling: false,
    },
    water: {
      usage: 0,
    },
  });
  
  const handleChange = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value,
      },
    }));
    // Clear errors when user types
    setErrors([]);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    
    try {
      // Calculate carbon footprint
      const result = calculateCarbonFootprint(formData);
      
      if (result.errors) {
        setErrors(result.errors);
        setLoading(false);
        return;
      }
      
      // Calculate eco score
      const ecoScore = calculateEcoScore(result.total);
      
      // Save to Firebase (using a default user ID for demo)
      const userId = 'demo-user';
      await saveActivityLog(userId, {
        activityData: formData,
        carbonFootprint: result,
        ecoScore,
      });
      
      // Navigate to dashboard with results
      navigate('/dashboard', {
        state: {
          carbonFootprint: result,
          ecoScore,
          justCalculated: true,
        },
      });
    } catch (error) {
      console.error('Calculation error', error);
      setErrors([{ field: 'general', message: 'An error occurred while calculating. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Carbon Footprint Calculator</h1>
        <p className="text-gray-600 mb-6">
          Enter your monthly activities to calculate your carbon footprint
        </p>
        
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Please fix the following errors:</h3>
            <ul className="list-disc list-inside text-red-700">
              {errors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Transport Section */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🚗 Transport</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="transport-mode" className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Mode of Transport
                </label>
                <select
                  id="transport-mode"
                  value={formData.transport.mode}
                  onChange={(e) => handleChange('transport', 'mode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-eco-green"
                >
                  <option value="car">Car</option>
                  <option value="bus">Bus</option>
                  <option value="train">Train</option>
                  <option value="bike">Bike</option>
                  <option value="walk">Walk</option>
                  <option value="flight">Flight</option>
                </select>
              </div>
              <div>
                <label htmlFor="transport-distance" className="block text-sm font-medium text-gray-700 mb-1">
                  Distance per Month (km)
                </label>
                <input
                  id="transport-distance"
                  type="number"
                  min="0"
                  max="10000"
                  value={formData.transport.distance}
                  onChange={(e) => handleChange('transport', 'distance', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-eco-green"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Electricity Section */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">⚡ Electricity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="electricity-usage" className="block text-sm font-medium text-gray-700 mb-1">
                  Monthly Usage (kWh)
                </label>
                <input
                  id="electricity-usage"
                  type="number"
                  min="0"
                  max="5000"
                  value={formData.electricity.usage}
                  onChange={(e) => handleChange('electricity', 'usage', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-eco-green"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Food Section */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🍽️ Food</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="meat-consumption" className="block text-sm font-medium text-gray-700 mb-1">
                  Meat Consumption
                </label>
                <select
                  id="meat-consumption"
                  value={formData.food.meatConsumption}
                  onChange={(e) => handleChange('food', 'meatConsumption', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-eco-green"
                >
                  <option value="high">High (Daily)</option>
                  <option value="medium">Medium (4-5x/week)</option>
                  <option value="low">Low (1-2x/week)</option>
                  <option value="none">None (Plant-based)</option>
                </select>
              </div>
              <div>
                <label htmlFor="food-waste" className="block text-sm font-medium text-gray-700 mb-1">
                  Food Waste Level
                </label>
                <select
                  id="food-waste"
                  value={formData.food.foodWaste}
                  onChange={(e) => handleChange('food', 'foodWaste', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-eco-green"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.food.localProduce}
                    onChange={(e) => handleChange('food', 'localProduce', e.target.checked)}
                    className="mr-2 h-4 w-4 text-eco-green focus:ring-eco-green border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">I buy local/seasonal produce</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Shopping Section */}
          <div className="border-b pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🛍️ Shopping</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="new-clothes" className="block text-sm font-medium text-gray-700 mb-1">
                  New Clothes per Month
                </label>
                <input
                  id="new-clothes"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.shopping.newClothes}
                  onChange={(e) => handleChange('shopping', 'newClothes', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-eco-green"
                  required
                />
              </div>
              <div>
                <label htmlFor="electronics" className="block text-sm font-medium text-gray-700 mb-1">
                  New Electronics per Year
                </label>
                <input
                  id="electronics"
                  type="number"
                  min="0"
                  max="20"
                  value={formData.shopping.electronics}
                  onChange={(e) => handleChange('shopping', 'electronics', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-eco-green"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.shopping.recycling}
                    onChange={(e) => handleChange('shopping', 'recycling', e.target.checked)}
                    className="mr-2 h-4 w-4 text-eco-green focus:ring-eco-green border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">I recycle regularly</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Water Section */}
          <div className="pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">💧 Water</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="water-usage" className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Usage (liters)
                </label>
                <input
                  id="water-usage"
                  type="number"
                  min="0"
                  max="1000"
                  value={formData.water.usage}
                  onChange={(e) => handleChange('water', 'usage', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-eco-green"
                  required
                />
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-eco-green text-white font-semibold rounded-md hover:bg-eco-dark focus:outline-none focus:ring-2 focus:ring-eco-green focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Calculating...' : 'Calculate Carbon Footprint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CarbonCalculator;

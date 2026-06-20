import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getActivityLogs } from '../services/firebaseService';
import { generateRecommendations } from '../services/geminiService';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Dashboard() {
  const location = useLocation();
  const [carbonFootprint, setCarbonFootprint] = useState(null);
  const [ecoScore, setEcoScore] = useState(null);
  const [activityHistory, setActivityHistory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Check if we have fresh data from calculator
      if (location.state?.carbonFootprint) {
        setCarbonFootprint(location.state.carbonFootprint);
        setEcoScore(location.state.ecoScore);
        
        // Load recommendations
        if (location.state.justCalculated) {
          setLoadingRecommendations(true);
          const recs = await generateRecommendations(location.state.carbonFootprint);
          setRecommendations(recs);
          setLoadingRecommendations(false);
        }
      }
      
      // Load historical data
      try {
        const userId = 'demo-user';
        const logs = await getActivityLogs(userId, 10);
        setActivityHistory(logs);
        
        // If no fresh data, use most recent
        if (!location.state?.carbonFootprint && logs.length > 0) {
          setCarbonFootprint(logs[0].carbonFootprint);
          setEcoScore(logs[0].ecoScore);
          
          // Load recommendations
          setLoadingRecommendations(true);
          const recs = await generateRecommendations(logs[0].carbonFootprint);
          setRecommendations(recs);
          setLoadingRecommendations(false);
        }
      } catch (error) {
        console.error('Error loading data', error);
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [location.state]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-eco-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (!carbonFootprint) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Yet</h2>
          <p className="text-gray-600 mb-6">
            Calculate your carbon footprint to see your dashboard
          </p>
          <a
            href="/calculator"
            className="inline-block px-6 py-3 bg-eco-green text-white font-semibold rounded-md hover:bg-eco-dark transition-colors"
          >
            Go to Calculator
          </a>
        </div>
      </div>
    );
  }
  
  // Prepare chart data
  const categoryData = {
    labels: Object.keys(carbonFootprint.byCategory).map(
      key => key.charAt(0).toUpperCase() + key.slice(1)
    ),
    datasets: [
      {
        data: Object.values(carbonFootprint.byCategory),
        backgroundColor: [
          '#ef4444', // Red for transport
          '#f59e0b', // Orange for electricity
          '#10b981', // Green for food
          '#3b82f6', // Blue for shopping
          '#8b5cf6', // Purple for water
        ],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toFixed(2)} kg CO₂ (${percentage}%)`;
          },
        },
      },
    },
  };
  
  // Prepare trend data
  const trendData = {
    labels: activityHistory.map((_, index) => `Week ${activityHistory.length - index}`).reverse(),
    datasets: [
      {
        label: 'Total CO₂ Emissions',
        data: activityHistory.map(log => log.carbonFootprint.total).reverse(),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
    ],
  };
  
  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'kg CO₂',
        },
      },
    },
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Carbon Footprint Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Emissions</h3>
          <p className="text-4xl font-bold text-gray-900">{carbonFootprint.total}</p>
          <p className="text-sm text-gray-600 mt-1">kg CO₂ per month</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Eco Score</h3>
          <div className="flex items-center">
            <p className="text-4xl font-bold" style={{ color: ecoScore.color }}>
              {ecoScore.score}
            </p>
            <span className="text-2xl text-gray-400 ml-2">/100</span>
          </div>
          <p className="text-sm font-medium mt-1" style={{ color: ecoScore.color }}>
            {ecoScore.classification}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Top Category</h3>
          <p className="text-2xl font-bold text-gray-900">
            {Object.entries(carbonFootprint.byCategory)
              .sort(([, a], [, b]) => b - a)[0][0]
              .charAt(0).toUpperCase() + 
              Object.entries(carbonFootprint.byCategory)
              .sort(([, a], [, b]) => b - a)[0][0]
              .slice(1)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {Object.entries(carbonFootprint.byCategory)
              .sort(([, a], [, b]) => b - a)[0][1].toFixed(2)} kg CO₂
          </p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Emissions by Category</h2>
          <div style={{ height: '300px' }}>
            <Pie data={categoryData} options={chartOptions} />
          </div>
        </div>
        
        {activityHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Emissions Trend</h2>
            <div style={{ height: '300px' }}>
              <Line data={trendData} options={trendOptions} />
            </div>
          </div>
        )}
      </div>
      
      {/* AI Recommendations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">AI-Powered Recommendations</h2>
        
        {loadingRecommendations ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-green mx-auto mb-4"></div>
            <p className="text-gray-600">Generating personalized recommendations...</p>
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    rec.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    rec.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {rec.difficulty}
                  </span>
                  <span className="text-xs text-gray-500">
                    {rec.category}
                  </span>
                </div>
                <p className="text-sm text-gray-900 mb-2">{rec.action}</p>
                <p className="text-xs text-eco-green font-semibold">
                  Save ~{rec.estimatedSavings} kg CO₂/month
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No recommendations available at this time.</p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

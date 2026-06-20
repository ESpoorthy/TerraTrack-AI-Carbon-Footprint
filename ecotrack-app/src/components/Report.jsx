import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { generateReport, downloadReport } from '../services/reportGenerator';
import { getProgressData } from '../services/progressTracker';
import { getActivityLogs } from '../services/firebaseService';

function Report() {
  const location = useLocation();
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [carbonFootprint, setCarbonFootprint] = useState(null);
  const [ecoScore, setEcoScore] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [generated, setGenerated] = useState(false);

  const userId = 'demo-user';

  useEffect(() => {
    const loadData = async () => {
      try {
        // Use data passed from dashboard/calculator if available
        if (location.state?.carbonFootprint) {
          setCarbonFootprint(location.state.carbonFootprint);
          setEcoScore(location.state.ecoScore);
          setRecommendations(location.state.recommendations || []);
        } else {
          // Load from Firebase
          const logs = await getActivityLogs(userId, 1);
          if (logs.length > 0) {
            setCarbonFootprint(logs[0].carbonFootprint);
            setEcoScore(logs[0].ecoScore);
          }
        }

        const progress = await getProgressData(userId);
        setProgressData(progress);
      } catch (err) {
        console.error('Error loading report data', err);
      }
    };

    loadData();
  }, [location.state]);

  const handleGenerateReport = async () => {
    if (!carbonFootprint || !ecoScore || !progressData) {
      setError('No data available. Please calculate your carbon footprint first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const report = await generateReport(
        userId,
        carbonFootprint,
        ecoScore,
        progressData,
        recommendations,
        'text'
      );
      setReportText(report);
      setGenerated(true);
    } catch (err) {
      setError('Error generating report. Please try again.');
      console.error('Report generation error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (reportText) {
      downloadReport(reportText, 'text');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sustainability Report</h1>
        <p className="text-gray-600">
          Generate and download a detailed report of your carbon footprint and sustainability journey.
        </p>
      </div>

      {/* Data Summary */}
      {carbonFootprint && ecoScore && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-eco-green">
            <p className="text-sm text-gray-500 mb-1">Total Emissions</p>
            <p className="text-2xl font-bold text-gray-900">{carbonFootprint.total}</p>
            <p className="text-xs text-gray-500">kg CO₂ / month</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-5 border-l-4" style={{ borderColor: ecoScore.color }}>
            <p className="text-sm text-gray-500 mb-1">Eco Score</p>
            <p className="text-2xl font-bold" style={{ color: ecoScore.color }}>{ecoScore.score}/100</p>
            <p className="text-xs font-medium" style={{ color: ecoScore.color }}>{ecoScore.classification}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 mb-1">Your Level</p>
            <p className="text-2xl font-bold text-gray-900">{progressData?.currentLevel || 1}</p>
            <p className="text-xs text-gray-500">{progressData?.levelTitle || 'Green Starter'}</p>
          </div>
        </div>
      )}

      {!carbonFootprint && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 text-center">
          <p className="text-yellow-800 font-medium mb-2">No data available</p>
          <p className="text-yellow-700 text-sm mb-4">
            Please calculate your carbon footprint first to generate a report.
          </p>
          <a
            href="/calculator"
            className="inline-block px-5 py-2 bg-eco-green text-white font-semibold rounded-md hover:bg-eco-dark transition-colors text-sm"
          >
            Go to Calculator
          </a>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Generate Button */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={handleGenerateReport}
          disabled={loading || !carbonFootprint}
          aria-busy={loading}
          className="px-6 py-3 bg-eco-green text-white font-semibold rounded-md hover:bg-eco-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block"></span>
              Generating...
            </>
          ) : (
            <>📄 Generate Report</>
          )}
        </button>

        {generated && (
          <button
            onClick={handleDownload}
            className="px-6 py-3 bg-white border-2 border-eco-green text-eco-green font-semibold rounded-md hover:bg-eco-light transition-colors flex items-center gap-2"
          >
            ⬇️ Download Report
          </button>
        )}
      </div>

      {/* Report Preview */}
      {reportText && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Report Preview</h2>
            <span className="text-xs text-gray-400">
              Generated {new Date().toLocaleDateString()}
            </span>
          </div>
          <pre
            aria-label="Report content"
            className="whitespace-pre-wrap text-sm text-gray-700 font-mono bg-gray-50 rounded-md p-4 overflow-auto max-h-[600px] leading-relaxed"
          >
            {reportText}
          </pre>
        </div>
      )}
    </div>
  );
}

export default Report;

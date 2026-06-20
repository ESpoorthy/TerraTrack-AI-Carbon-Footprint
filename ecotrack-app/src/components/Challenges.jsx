import { useState, useEffect } from 'react';
import { generateChallenges } from '../services/geminiService';
import { saveChallengeProgress, getChallengeHistory } from '../services/firebaseService';
import { awardPoints, getProgressData } from '../services/progressTracker';

function Challenges() {
  const [challenges, setChallenges] = useState([]);
  const [completedChallenges, setCompletedChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [actionInput, setActionInput] = useState({});
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  const userId = 'demo-user';
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    try {
      // Get progress data
      const progress = await getProgressData(userId);
      setProgressData(progress);
      
      // Get challenge history
      const history = await getChallengeHistory(userId);
      setCompletedChallenges(history.filter(c => c.completed));
      
      // Generate new challenges
      const completedIds = history.filter(c => c.completed).map(c => c.challengeId);
      const newChallenges = await generateChallenges(progress.currentLevel, completedIds);
      
      // Filter out already completed challenges
      const availableChallenges = newChallenges.filter(
        challenge => !completedIds.includes(challenge.id)
      );
      
      setChallenges(availableChallenges);
    } catch (error) {
      console.error('Error loading challenges', error);
    }
    setLoading(false);
  };
  
  const handleCompleteChallenge = async (challenge) => {
    const action = actionInput[challenge.id] || '';
    
    if (!action.trim()) {
      alert('Please describe what action you took to complete this challenge');
      return;
    }
    
    try {
      // Save challenge progress
      await saveChallengeProgress(userId, {
        challengeId: challenge.id,
        title: challenge.title,
        description: challenge.description,
        criteria: challenge.criteria,
        points: challenge.points,
        category: challenge.category,
        completed: true,
        completedAt: new Date(),
        actions: [action],
      });
      
      // Award points
      const updatedProgress = await awardPoints(userId, challenge.points);
      setProgressData(updatedProgress);
      
      // Show notification
      if (updatedProgress.leveledUp) {
        setNotificationMessage(`🎉 Challenge completed! You earned ${challenge.points} points and leveled up to ${updatedProgress.levelTitle}!`);
      } else {
        setNotificationMessage(`✅ Challenge completed! You earned ${challenge.points} points!`);
      }
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
      
      // Reload data
      await loadData();
      setActionInput({});
    } catch (error) {
      console.error('Error completing challenge', error);
      alert('Error completing challenge. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-eco-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading challenges...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Notification */}
      {showNotification && (
        <div className="fixed top-20 right-4 z-50 bg-eco-green text-white px-6 py-4 rounded-lg shadow-lg animate-fade-in">
          {notificationMessage}
        </div>
      )}
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Sustainability Challenges</h1>
        <p className="text-gray-600">
          Complete challenges to earn points, level up, and reduce your carbon footprint
        </p>
      </div>
      
      {/* Progress Card */}
      {progressData && (
        <div className="bg-gradient-to-r from-eco-green to-eco-dark text-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{progressData.levelTitle}</h2>
              <p className="text-sm opacity-90">Level {progressData.currentLevel}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{progressData.totalPoints}</p>
              <p className="text-sm opacity-90">Total Points</p>
            </div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-full h-3 mb-2">
            <div
              className="bg-white h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressData.progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm opacity-90">
            {progressData.pointsToNextLevel} points to next level
          </p>
        </div>
      )}
      
      {/* Available Challenges */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Available Challenges</h2>
        {challenges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="bg-white rounded-lg shadow-md p-6 border-2 border-transparent hover:border-eco-green transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{challenge.title}</h3>
                  <span className="px-3 py-1 bg-eco-light text-eco-dark text-sm font-semibold rounded-full">
                    {challenge.points} pts
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{challenge.description}</p>
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">Completion Criteria:</p>
                  <p className="text-sm text-gray-700">{challenge.criteria}</p>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    {challenge.category}
                  </span>
                  <span>{challenge.duration} days</span>
                </div>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Describe what you did..."
                    value={actionInput[challenge.id] || ''}
                    onChange={(e) => setActionInput({ ...actionInput, [challenge.id]: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-eco-green"
                  />
                  <button
                    onClick={() => handleCompleteChallenge(challenge)}
                    className="w-full px-4 py-2 bg-eco-green text-white font-semibold rounded-md hover:bg-eco-dark transition-colors"
                  >
                    Complete Challenge
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">
              No new challenges available right now. Check back soon!
            </p>
            <button
              onClick={loadData}
              className="px-6 py-2 bg-eco-green text-white font-semibold rounded-md hover:bg-eco-dark transition-colors"
            >
              Refresh Challenges
            </button>
          </div>
        )}
      </div>
      
      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Completed Challenges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedChallenges.map((challenge) => (
              <div key={challenge.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-md font-semibold text-gray-700">{challenge.title}</h3>
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{challenge.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{challenge.points} points earned</span>
                  <span>{challenge.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Challenges;

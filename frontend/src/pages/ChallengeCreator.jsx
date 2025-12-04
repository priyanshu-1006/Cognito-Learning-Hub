import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  Trophy, 
  Users, 
  BookOpen, 
  Send, 
  ArrowLeft,
  Clock,
  Target,
  Zap
} from 'lucide-react';

const ChallengeCreator = () => {
  const { user } = useContext(AuthContext);
  const [step, setStep] = useState('friends'); // 'friends', 'quiz', 'details', 'confirm'
  const [friends, setFriends] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [challengeMessage, setChallengeMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFriends();
    fetchQuizzes();
  }, []);

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('quizwise-token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/friends`, {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      if (response.ok) {
        setFriends(data.friends || []);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('quizwise-token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/quizzes`, {
        headers: { 'x-auth-token': token }
      });
      const data = await response.json();
      if (response.ok) {
        setQuizzes(data || []);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const createChallenge = async () => {
    if (!selectedFriend || !selectedQuiz) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('quizwise-token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/challenges/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({
          challengedUserId: selectedFriend.friend._id,
          quizId: selectedQuiz._id,
          message: challengeMessage || `${user.name} challenged you to a quiz!`
        })
      });

      if (response.ok) {
        alert('Challenge sent successfully! 🎉');
        // Reset form
        setStep('friends');
        setSelectedFriend(null);
        setSelectedQuiz(null);
        setChallengeMessage('');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create challenge');
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      alert('Failed to create challenge');
    } finally {
      setSubmitting(false);
    }
  };

  const renderFriendsStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="w-16 h-16 mx-auto mb-4 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Opponent</h2>
        <p className="text-gray-600">Select a friend to challenge to a quiz battle!</p>
      </div>

      {friends.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600 mb-4">No friends available to challenge.</p>
          <button 
            onClick={() => window.location.href = '/social'}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Find Friends
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {friends.map((friendship) => (
            <div
              key={friendship.friendshipId}
              onClick={() => {
                setSelectedFriend(friendship);
                setStep('quiz');
              }}
              className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 ${
                selectedFriend?.friendshipId === friendship.friendshipId 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-transparent'
              }`}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                  {friendship.friend.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-bold text-gray-800 mb-1">{friendship.friend.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{friendship.friend.role}</p>
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  Friends since {new Date(friendship.since).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderQuizStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep('friends')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Friends
        </button>
        <div className="text-sm text-gray-600">
          Challenging: <span className="font-medium text-blue-600">{selectedFriend?.friend.name}</span>
        </div>
      </div>

      <div className="text-center">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Select a Quiz</h2>
        <p className="text-gray-600">Choose the quiz you want to challenge your friend with</p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading quizzes...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow-md">
          <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-600 mb-4">No quizzes available.</p>
          <button 
            onClick={() => window.location.href = '/quiz-maker'}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
          >
            Create a Quiz
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {quizzes.map((quiz) => (
            <div
              key={quiz._id}
              onClick={() => {
                setSelectedQuiz(quiz);
                setStep('details');
              }}
              className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 ${
                selectedQuiz?._id === quiz._id 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-transparent'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800 mb-2 line-clamp-2">{quiz.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">{quiz.description}</p>
                </div>
                <div className="text-purple-600 ml-2">
                  <Target className="w-6 h-6" />
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {quiz.questions?.length || 0} questions
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {quiz.timeLimit || 'No limit'}
                </span>
              </div>
              
              <div className="mt-3 flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  quiz.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                  quiz.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {quiz.difficulty || 'Medium'}
                </span>
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                  {quiz.category || 'General'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep('quiz')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Quizzes
        </button>
      </div>

      <div className="text-center">
        <Zap className="w-16 h-16 mx-auto mb-4 text-yellow-600" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Challenge Details</h2>
        <p className="text-gray-600">Add a personal message to make it more exciting!</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-bold text-gray-800 mb-4">Challenge Summary</h3>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-gray-600">Opponent:</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {selectedFriend?.friend.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium text-gray-800">{selectedFriend?.friend.name}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <span className="text-gray-600">Quiz:</span>
            <span className="font-medium text-gray-800">{selectedQuiz?.title}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <span className="text-gray-600">Questions:</span>
            <span className="font-medium text-gray-800">{selectedQuiz?.questions?.length || 0}</span>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Challenge Message (Optional)
          </label>
          <textarea
            value={challengeMessage}
            onChange={(e) => setChallengeMessage(e.target.value)}
            placeholder="Add a fun message to your challenge... (e.g., 'Think you can beat me at this quiz? Let's see what you've got! 😎')"
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
            maxLength={200}
          />
          <div className="text-right text-sm text-gray-500">
            {challengeMessage.length}/200 characters
          </div>
        </div>

        <button
          onClick={() => setStep('confirm')}
          className="w-full bg-yellow-600 text-white py-3 rounded-lg font-medium hover:bg-yellow-700 transition-colors mt-6"
        >
          Continue to Review
        </button>
      </div>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep('details')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Details
        </button>
      </div>

      <div className="text-center">
        <Trophy className="w-16 h-16 mx-auto mb-4 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to Challenge?</h2>
        <p className="text-gray-600">Review your challenge details and send it!</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-bold text-gray-800 mb-6">Final Challenge Review</h3>
        
        <div className="space-y-4 mb-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-gray-600">Challenging</p>
            <p className="font-bold text-gray-800">{selectedFriend?.friend.name}</p>
            <p className="text-sm text-gray-500">{selectedFriend?.friend.role}</p>
          </div>
          
          <div className="border-l-4 border-purple-500 pl-4">
            <p className="text-sm text-gray-600">Quiz</p>
            <p className="font-bold text-gray-800">{selectedQuiz?.title}</p>
            <p className="text-sm text-gray-500">
              {selectedQuiz?.questions?.length || 0} questions • {selectedQuiz?.difficulty || 'Medium'} difficulty
            </p>
          </div>
          
          {challengeMessage && (
            <div className="border-l-4 border-yellow-500 pl-4">
              <p className="text-sm text-gray-600">Your Message</p>
              <p className="text-gray-800">"{challengeMessage}"</p>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-800 mb-2">What happens next?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Your friend will receive a notification about the challenge</li>
            <li>• They can accept or decline the challenge</li>
            <li>• If accepted, you both take the quiz and compete for the best score!</li>
            <li>• The winner gets bragging rights and achievements 🏆</li>
          </ul>
        </div>

        <button
          onClick={createChallenge}
          disabled={submitting}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Sending Challenge...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Challenge!
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-800">Create Challenge</h1>
              <div className="text-sm text-gray-600">
                Step {
                  step === 'friends' ? '1' :
                  step === 'quiz' ? '2' :
                  step === 'details' ? '3' : '4'
                } of 4
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-green-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: step === 'friends' ? '25%' : 
                         step === 'quiz' ? '50%' : 
                         step === 'details' ? '75%' : '100%' 
                }}
              ></div>
            </div>
          </div>

          {/* Step Content */}
          {step === 'friends' && renderFriendsStep()}
          {step === 'quiz' && renderQuizStep()}
          {step === 'details' && renderDetailsStep()}
          {step === 'confirm' && renderConfirmStep()}
        </div>
      </div>
    </div>
  );
};

export default ChallengeCreator;

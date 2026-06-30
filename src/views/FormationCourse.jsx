import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { formationsApi, progressApi } from '../api';
import './FormationCourse.css';

const FormationCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [expandedModule, setExpandedModule] = useState(null);
  const [lessonProgress, setLessonProgress] = useState({});
  const [progressMessage, setProgressMessage] = useState('');
  const [savingLessonId, setSavingLessonId] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0); // Track real time spent on current lesson
  const [timerInterval, setTimerInterval] = useState(null); // Timer interval reference

  // Save time spent to backend
  const saveTimeSpent = async (lessonId, timeToAdd) => {
    if (!lessonId || timeToAdd <= 0) return;
    try {
      const currentProgress = normalizeProgress(lessonProgress[lessonId]);
      const payload = {
        time_spent_seconds: currentProgress.time_spent_seconds + timeToAdd,
      };
      await progressApi.updateLessonProgress(lessonId, payload);
      // Update local state
      setLessonProgress((prev) => ({
        ...prev,
        [lessonId]: {
          ...prev[lessonId],
          time_spent_seconds: currentProgress.time_spent_seconds + timeToAdd,
        },
      }));
    } catch (err) {
      console.error("Failed to save time spent:", err);
    }
  };

  // Start timer for selected lesson
  const startTimer = (lessonId) => {
    // Clear any existing timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    // Reset time spent
    setTimeSpent(0);
    // Start new timer
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  // Stop timer and save accumulated time
  const stopTimer = () => {
    if (timerInterval && selectedLesson) {
      clearInterval(timerInterval);
      saveTimeSpent(selectedLesson.id, timeSpent);
      setTimerInterval(null);
      setTimeSpent(0);
    }
  };

  const normalizeProgress = (progress) => ({
    is_completed: Boolean(progress?.is_completed),
    progress_percent: Number(progress?.progress_percent) || 0,
    time_spent_seconds: Number(progress?.time_spent_seconds) || 0,
  });

  const parseDurationToSeconds = (duration) => {
    if (!duration) {
      return 0;
    }

    const hoursMatch = duration.match(/(\d+)\s*h/i);
    const minutesMatch = duration.match(/(\d+)\s*min/i);
    const secondsMatch = duration.match(/(\d+)\s*s/i);

    return (
      (hoursMatch ? Number(hoursMatch[1]) * 3600 : 0) +
      (minutesMatch ? Number(minutesMatch[1]) * 60 : 0) +
      (secondsMatch ? Number(secondsMatch[1]) : 0)
    );
  };

  const loadLessonProgress = async (courseModules) => {
    const lessons = courseModules.flatMap((module) => module.lessons || []);
    if (lessons.length === 0) {
      setLessonProgress({});
      return;
    }

    const results = await Promise.allSettled(
      lessons.map((lesson) => progressApi.getLessonProgress(lesson.id))
    );

    const progressMap = {};
    results.forEach((result, index) => {
      const lessonId = lessons[index].id;
      progressMap[lessonId] = result.status === 'fulfilled'
        ? normalizeProgress(result.value.data)
        : normalizeProgress();
    });

    setLessonProgress(progressMap);
  };

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        const response = await formationsApi.getModules(id);
        const courseModules = response.data;
        setModules(courseModules);
        await loadLessonProgress(courseModules);
        if (courseModules.length > 0 && courseModules[0].lessons.length > 0) {
          setExpandedModule(courseModules[0].id);
          setSelectedLesson(courseModules[0].lessons[0]);
          // Start timer for initial lesson
          startTimer(courseModules[0].lessons[0].id);
        }
      } catch (err) {
        if (err.response?.status === 403) {
          setError("Vous n'avez pas accès à cette formation");
        } else {
          setError("Impossible de charger le contenu de la formation");
        }
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, [id]);

  const toggleModule = (moduleId) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const selectLesson = (lesson) => {
    // Save time from previous lesson
    if (selectedLesson && selectedLesson.id !== lesson.id) {
      stopTimer();
    }
    setProgressMessage('');
    setSelectedLesson(lesson);
    // Initialize time spent from progress
    const currentProgress = normalizeProgress(lessonProgress[lesson.id]);
    // Start timer for new lesson
    startTimer(lesson.id);
  };

  // Save time when component unmounts or selectedLesson changes
  useEffect(() => {
    return () => {
      stopTimer();
    };
  }, [selectedLesson, timeSpent, timerInterval]);

  const markLessonAsCompleted = async (lesson = selectedLesson) => {
    if (!lesson || savingLessonId === lesson.id) {
      return;
    }

    const currentProgress = normalizeProgress(lessonProgress[lesson.id]);
    if (currentProgress.is_completed) {
      setProgressMessage('Cette lecon est deja marquee comme terminee.');
      return;
    }

    try {
      setSavingLessonId(lesson.id);
      setProgressMessage('');
      // Calculate total time: previously saved + current session
      const totalTimeSpent = currentProgress.time_spent_seconds + timeSpent;
      const payload = {
        progress_percent: 100,
        is_completed: true,
        time_spent_seconds: totalTimeSpent > 0 ? totalTimeSpent : parseDurationToSeconds(lesson.duration),
      };
      await progressApi.updateLessonProgress(lesson.id, payload);
      setLessonProgress((prev) => ({
        ...prev,
        [lesson.id]: {
          is_completed: true,
          progress_percent: 100,
          time_spent_seconds: totalTimeSpent > 0 ? totalTimeSpent : parseDurationToSeconds(lesson.duration),
        },
      }));
      // Stop the timer
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
        setTimeSpent(0);
      }
      setProgressMessage('Lecon marquee comme terminee. Votre progression a ete mise a jour.');
    } catch (err) {
      console.error(err);
      setProgressMessage("Impossible d'enregistrer la progression pour le moment.");
    } finally {
      setSavingLessonId(null);
    }
  };

  const getModuleCompletion = (module) => {
    const lessons = module.lessons || [];
    const completed = lessons.filter((lesson) => lessonProgress[lesson.id]?.is_completed).length;
    return {
      completed,
      total: lessons.length,
    };
  };

  const selectedLessonProgress = selectedLesson ? normalizeProgress(lessonProgress[selectedLesson.id]) : normalizeProgress();

  if (loading) {
    return <div className="course-loading">Chargement du contenu...</div>;
  }

  if (error) {
    return (
      <div className="course-error">
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/formations')} className="back-button">
          Retour aux formations
        </button>
      </div>
    );
  }

  return (
    <div className="formation-course">
      <div className="course-sidebar">
        <div className="sidebar-header">
          <h2>Contenu de la formation</h2>
        </div>
        <div className="modules-list">
          {modules.map((module, idx) => (
            <div key={module.id} className="module-item">
              <button 
                className={`module-toggle ${expandedModule === module.id ? 'expanded' : ''}`}
                onClick={() => toggleModule(module.id)}
              >
                <span className="module-icon">📚</span>
                <span className="module-title">{module.title}</span>
                <span className="module-count">
                  {getModuleCompletion(module).completed}/{getModuleCompletion(module).total} lecons
                </span>
                <span className={`toggle-icon ${expandedModule === module.id ? 'rotated' : ''}`}>▼</span>
              </button>
              {expandedModule === module.id && (
                <div className="lessons-list">
                  {module.lessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      className={`lesson-item ${selectedLesson?.id === lesson.id ? 'active' : ''}`}
                      onClick={() => selectLesson(lesson)}
                    >
                      <span className="lesson-icon">
                        {lessonProgress[lesson.id]?.is_completed ? '✅' : lesson.video_url ? '🎥' : '📄'}
                      </span>
                      <span className="lesson-title">{lesson.title}</span>
                      <span className={`lesson-status ${lessonProgress[lesson.id]?.is_completed ? 'completed' : 'pending'}`}>
                        {lessonProgress[lesson.id]?.is_completed ? 'Terminee' : 'A faire'}
                      </span>
                      {lesson.duration && (
                        <span className="lesson-duration">{lesson.duration}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="course-content">
        {selectedLesson ? (
          <div className="lesson-content">
            <div className="lesson-header">
              <h1>{selectedLesson.title}</h1>
              {selectedLesson.description && (
                <p className="lesson-description">{selectedLesson.description}</p>
              )}
              <div className="lesson-progress-summary">
                <span className={`lesson-badge ${selectedLessonProgress.is_completed ? 'completed' : 'pending'}`}>
                  {selectedLessonProgress.is_completed ? 'Terminee' : 'Non terminee'}
                </span>
                <span className="lesson-badge neutral">
                  {selectedLessonProgress.progress_percent}% progression
                </span>
                <span className="lesson-badge time">
                  ⏱️ {Math.floor((selectedLessonProgress.time_spent_seconds + timeSpent) / 60)} min
                </span>
              </div>
              {progressMessage && <p className="progress-message">{progressMessage}</p>}
            </div>

            {selectedLesson.video_url && (
              <div className="video-container">
                <video
                  controls
                  src={selectedLesson.video_url}
                  className="lesson-video"
                  onEnded={() => markLessonAsCompleted(selectedLesson)}
                >
                  Votre navigateur ne supporte pas la vidéo.
                </video>
              </div>
            )}

            {selectedLesson.pdf_url && (
              <div className="pdf-container">
                <div className="pdf-header">
                  <span className="pdf-icon">📄</span>
                  <h3>Document PDF</h3>
                </div>
                <iframe 
                  src={selectedLesson.pdf_url} 
                  className="pdf-iframe"
                  title="Document PDF"
                />
                <a 
                  href={selectedLesson.pdf_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="download-pdf-button"
                  onClick={() => markLessonAsCompleted(selectedLesson)}
                >
                  Télécharger le PDF
                </a>
              </div>
            )}

            {!selectedLesson.video_url && !selectedLesson.pdf_url && (
              <div className="no-content">
                <p>Aucun contenu disponible pour cette leçon.</p>
              </div>
            )}


          </div>
        ) : (
          <div className="no-lesson-selected">
            <div className="no-lesson-icon">📖</div>
            <h2>Sélectionnez une leçon</h2>
            <p>Choisissez une leçon dans la barre latérale pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormationCourse;

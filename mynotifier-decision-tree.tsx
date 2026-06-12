import React, { useState, useMemo } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const CRANE_POSITIONS = [
  { id: 'extended', label: 'Fully Extended', threshold: 35 },
  { id: 'partial', label: 'Partially Extended', threshold: 55 },
  { id: 'down', label: 'Boom Down', threshold: 75 },
  { id: 'jackknife', label: 'Jack-knife (Stored)', threshold: 90 },
  { id: 'unknown', label: 'Unknown', threshold: null }
];

const LIEBHERR_YELLOW = '#FFD320';
const LIEBHERR_BLACK = '#1A1A1A';
const LIEBHERR_GREY = '#6B7280';

export default function MyNotifierDecisionTree() {
  const [forecastWind, setForecastWind] = useState(50);
  const [lastPosition, setLastPosition] = useState('down');
  const [offlineHours, setOfflineHours] = useState(48);
  const [userConfirmed, setUserConfirmed] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [tempSelectedPosition, setTempSelectedPosition] = useState('down');
  const [manualVerificationTime, setManualVerificationTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [positionSetUntil, setPositionSetUntil] = useState(null);
  const [tempPositionSetUntil, setTempPositionSetUntil] = useState('');
  const [allowMachineOverride, setAllowMachineOverride] = useState(true);
  const [tempAllowMachineOverride, setTempAllowMachineOverride] = useState(true);
  
  const statusViewRef = React.useRef(null);

  // Get next business day at 6:00 AM
  const getNextBusinessDay = () => {
    const now = new Date();
    let next = new Date(now);
    next.setDate(next.getDate() + 1);
    next.setHours(6, 0, 0, 0);
    
    // If tomorrow is Saturday (6), add 2 days to get to Monday
    // If tomorrow is Sunday (0), add 1 day to get to Monday
    const dayOfWeek = next.getDay();
    if (dayOfWeek === 6) { // Saturday
      next.setDate(next.getDate() + 2);
    } else if (dayOfWeek === 0) { // Sunday
      next.setDate(next.getDate() + 1);
    }
    
    return next.toISOString().slice(0, 16); // Format for datetime-local input
  };

  // Initialize temp position with current position
  React.useEffect(() => {
    setTempSelectedPosition(lastPosition);
    if (!tempPositionSetUntil) {
      setTempPositionSetUntil(positionSetUntil || getNextBusinessDay());
    }
    setTempAllowMachineOverride(allowMachineOverride);
  }, [lastPosition]);

  // Update current time every second for real-time verification age display
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000); // Update every second for demo purposes
    
    return () => clearInterval(interval);
  }, []);

  // Check if position setting has expired
  const isPositionSettingExpired = () => {
    if (!positionSetUntil) return false;
    return new Date(positionSetUntil) < new Date(currentTime);
  };

  // Check if setting duration is >7 days
  const isLongDuration = (dateTimeString) => {
    if (!dateTimeString) return false;
    const setUntilDate = new Date(dateTimeString);
    const now = new Date();
    const diffInDays = (setUntilDate - now) / (1000 * 60 * 60 * 24);
    return diffInDays > 7;
  };

  // Format date for display
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate time since manual verification
  const getManualVerificationAge = () => {
    if (!manualVerificationTime) return null;
    
    const ageInSeconds = Math.floor((currentTime - manualVerificationTime) / 1000);
    
    if (ageInSeconds < 60) {
      return ageInSeconds === 1 ? '1 second' : `${ageInSeconds} seconds`;
    }
    
    const ageInMinutes = Math.floor(ageInSeconds / 60);
    
    if (ageInMinutes === 1) return '1 minute';
    if (ageInMinutes < 60) return `${ageInMinutes} minutes`;
    
    const ageInHours = Math.floor(ageInMinutes / 60);
    const remainingMinutes = ageInMinutes % 60;
    
    if (ageInHours === 1) {
      return remainingMinutes > 0 ? `1 hour ${remainingMinutes} minutes` : '1 hour';
    }
    return remainingMinutes > 0 ? `${ageInHours} hours ${remainingMinutes} minutes` : `${ageInHours} hours`;
  };

  const handleConfirmPosition = () => {
    // Update the actual position
    setLastPosition(tempSelectedPosition);
    // Mark as user confirmed
    setUserConfirmed(true);
    // Record manual verification timestamp
    setManualVerificationTime(Date.now());
    // Save position set until date/time
    setPositionSetUntil(tempPositionSetUntil);
    // Save machine override preference
    setAllowMachineOverride(tempAllowMachineOverride);
    // Show success message
    setShowSuccessMessage(true);
    
    // Scroll to status view
    setTimeout(() => {
      statusViewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    // Hide success message after 2 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 2000);
  };

  const decision = useMemo(() => {
    const leastSafeThreshold = 35;
    const mostSafeThreshold = 90;
    const currentPosition = CRANE_POSITIONS.find(p => p.id === lastPosition);
    const lastKnownThreshold = currentPosition?.threshold;

    // Case 1: Forecast below least safe threshold
    if (forecastWind < leastSafeThreshold) {
      return {
        case: 1,
        title: 'CASE 1: Safe in All Positions',
        alertLevel: 'none',
        color: 'bg-green-500',
        icon: CheckCircle,
        description: `Forecast (${forecastWind} km/h) is below minimum threshold (${leastSafeThreshold} km/h). Crane is safe in ANY position.`,
        action: 'No alert sent',
        appStatus: 'SAFE (all configurations)',
        smsContent: null,
        emailContent: null
      };
    }

    // Case 4: Forecast exceeds safest position
    if (forecastWind > mostSafeThreshold) {
      return {
        case: 4,
        title: 'CASE 4: Critical - Exceeds All Safe Positions',
        alertLevel: 'critical',
        color: 'bg-red-600',
        icon: XCircle,
        description: `Forecast (${forecastWind} km/h) exceeds even safest position (${mostSafeThreshold} km/h). Only jack-knife position is safe.`,
        action: 'Critical alert sent immediately',
        appStatus: 'UNSAFE (all positions except jack-knife)',
        smsContent: `CRITICAL: Wind forecast ${forecastWind} km/h at midnight. Exceeds all safe configurations. Crane must be in jack-knife position.`,
        emailContent: `CRITICAL WIND ALERT\n\nCrane: XYZ-123\nForecast: ${forecastWind} km/h\nStatus: UNSAFE for all positions except jack-knife\n\nImmediate action required: Verify crane is in jack-knife stored position.`
      };
    }

    // Case 2 & 3: Between thresholds
    if (lastKnownThreshold === null || lastPosition === 'unknown') {
      // Unknown position
      if (forecastWind >= leastSafeThreshold && forecastWind < mostSafeThreshold) {
        return {
          case: 3,
          subCase: 'C',
          title: 'CASE 3C: Unknown Position - High Priority',
          alertLevel: 'high',
          color: 'bg-orange-500',
          icon: AlertTriangle,
          description: `Forecast (${forecastWind} km/h) may exceed safe limits. Position unknown - assuming worst case.`,
          action: 'High-priority alert sent',
          appStatus: 'UNCERTAIN (position unknown)',
          smsContent: `URGENT: Wind forecast ${forecastWind} km/h at 3am. Last known position: Unknown (${offlineHours}h ago). Verify crane position immediately.`,
          emailContent: `HIGH PRIORITY WIND ALERT\n\nCrane: XYZ-123\nForecast: ${forecastWind} km/h\nLast Known Position: Unknown\nOffline: ${offlineHours} hours\n\nAction required: Verify crane position and update in app to ensure accurate monitoring.`
        };
      }
    }

    // Case 2: Forecast between least safe and last known
    if (forecastWind < lastKnownThreshold) {
      return {
        case: 2,
        title: 'CASE 2: Safe IF Position Unchanged',
        alertLevel: 'confirm',
        color: 'bg-yellow-500',
        icon: AlertCircle,
        description: `Forecast (${forecastWind} km/h) is below last known threshold (${lastKnownThreshold} km/h for ${currentPosition.label}), but position needs verification.`,
        action: 'Prompt to confirm position (no SMS yet)',
        appStatus: 'SAFE (if last position correct)',
        smsContent: null, // Only sent if no confirmation after 1 hour
        emailContent: null
      };
    }

    // Case 3: Forecast exceeds last known threshold
    if (forecastWind >= lastKnownThreshold) {
      // Sub-case 3A: User recently confirmed
      if (userConfirmed) {
        return {
          case: 3,
          subCase: 'A',
          title: 'CASE 3A: Alert Based on Confirmed Position',
          alertLevel: 'normal',
          color: 'bg-orange-500',
          icon: AlertTriangle,
          description: `Forecast (${forecastWind} km/h) exceeds threshold for confirmed position (${currentPosition.label}: ${lastKnownThreshold} km/h).`,
          action: 'Normal alert sent',
          appStatus: `UNSAFE for ${currentPosition.label}`,
          smsContent: `Wind forecast ${forecastWind} km/h at 3am. Crane in ${currentPosition.label} (max ${lastKnownThreshold} km/h). Action required.`,
          emailContent: `WIND ALERT\n\nCrane: XYZ-123\nForecast: ${forecastWind} km/h\nCurrent Position: ${currentPosition.label} (confirmed)\nMax Safe Wind: ${lastKnownThreshold} km/h\n\nAction required: Move crane to safer position or cease operations.`
        };
      }

      // Sub-case 3B: Last known was safe position
      if (lastPosition === 'down' || lastPosition === 'jackknife') {
        return {
          case: 3,
          subCase: 'B',
          title: 'CASE 3B: Last Known Safe - Needs Confirmation',
          alertLevel: 'medium',
          color: 'bg-orange-400',
          icon: AlertTriangle,
          description: `Forecast (${forecastWind} km/h) exceeds threshold. Last known position was safe (${currentPosition.label}), but data is ${offlineHours}h old.`,
          action: 'Low-priority alert requesting confirmation',
          appStatus: `Check required - may be unsafe`,
          smsContent: `Wind forecast ${forecastWind} km/h at 3am. Last known: ${currentPosition.label} (${offlineHours}h ago). Confirm position or crane may be at risk.`,
          emailContent: `WIND ALERT - CONFIRMATION NEEDED\n\nCrane: XYZ-123\nForecast: ${forecastWind} km/h\nLast Known Position: ${currentPosition.label} (${offlineHours} hours ago)\n\nPlease confirm crane is still in safe position via app.`
        };
      }

      // Sub-case 3C: Last known was unsafe position
      return {
        case: 3,
        subCase: 'C',
        title: 'CASE 3C: Last Known Unsafe - High Priority',
        alertLevel: 'high',
        color: 'bg-red-500',
        icon: AlertTriangle,
        description: `Forecast (${forecastWind} km/h) exceeds threshold. Last known position was unsafe (${currentPosition.label}: ${lastKnownThreshold} km/h).`,
        action: 'High-priority alert requiring immediate action',
        appStatus: 'UNSAFE - Immediate action required',
        smsContent: `URGENT: Wind forecast ${forecastWind} km/h at 3am. Last known: ${currentPosition.label} (${offlineHours}h ago). Verify crane position immediately.`,
        emailContent: `HIGH PRIORITY WIND ALERT\n\nCrane: XYZ-123\nForecast: ${forecastWind} km/h\nLast Known Position: ${currentPosition.label} (${offlineHours} hours ago)\nMax Safe Wind: ${lastKnownThreshold} km/h\n\nIMMEDIATE ACTION REQUIRED: This forecast exceeds safe limits for last known position. Verify and update crane position urgently.`
      };
    }

    return null;
  }, [forecastWind, lastPosition, offlineHours, userConfirmed]);

  const AlertIcon = decision?.icon || AlertCircle;

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#F3F4F6' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6" style={{ backgroundColor: LIEBHERR_YELLOW }}>
          <h1 className="text-3xl font-bold" style={{ color: LIEBHERR_BLACK }}>
            MyNotifier WIND
          </h1>
          <p className="text-lg mt-2" style={{ color: LIEBHERR_BLACK }}>
            Alert Decision Logic Explorer
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6" style={{ borderTop: `4px solid ${LIEBHERR_YELLOW}` }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: LIEBHERR_BLACK }}>
            Scenario Configuration
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Forecast Wind Speed */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: LIEBHERR_BLACK }}>
                Forecast Wind Speed: <span className="text-2xl font-bold">{forecastWind} km/h</span>
              </label>
              <input
                type="range"
                min="0"
                max="120"
                step="5"
                value={forecastWind}
                onChange={(e) => setForecastWind(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ 
                  background: `linear-gradient(to right, ${LIEBHERR_YELLOW} 0%, ${LIEBHERR_YELLOW} ${(forecastWind/120)*100}%, ${LIEBHERR_GREY} ${(forecastWind/120)*100}%, ${LIEBHERR_GREY} 100%)`
                }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: LIEBHERR_GREY }}>
                <span>0</span>
                <span>30</span>
                <span>60</span>
                <span>90</span>
                <span>120</span>
              </div>
            </div>

            {/* Last Known Position */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: LIEBHERR_BLACK }}>
                Last Known Crane Position
              </label>
              <select
                value={lastPosition}
                onChange={(e) => setLastPosition(e.target.value)}
                className="w-full p-2 border-2 rounded-lg"
                style={{ borderColor: LIEBHERR_YELLOW, color: LIEBHERR_BLACK }}
              >
                {CRANE_POSITIONS.map(pos => (
                  <option key={pos.id} value={pos.id}>
                    {pos.label} {pos.threshold ? `(max ${pos.threshold} km/h)` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Offline Duration */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: LIEBHERR_BLACK }}>
                Machine Offline Duration: <span className="font-bold">{offlineHours} hours</span>
              </label>
              <input
                type="range"
                min="0"
                max="168"
                step="6"
                value={offlineHours}
                onChange={(e) => {
                  setOfflineHours(parseInt(e.target.value));
                  // Reset manual verification when simulating different offline duration
                  if (parseInt(e.target.value) !== offlineHours) {
                    setManualVerificationTime(null);
                    setUserConfirmed(false);
                    setPositionSetUntil(null);
                    setTempPositionSetUntil(getNextBusinessDay());
                  }
                }}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ 
                  background: `linear-gradient(to right, ${LIEBHERR_YELLOW} 0%, ${LIEBHERR_YELLOW} ${(offlineHours/168)*100}%, ${LIEBHERR_GREY} ${(offlineHours/168)*100}%, ${LIEBHERR_GREY} 100%)`
                }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: LIEBHERR_GREY }}>
                <span>0h</span>
                <span>1d</span>
                <span>3d</span>
                <span>7d</span>
              </div>
            </div>

            {/* User Confirmation */}
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={userConfirmed}
                  onChange={(e) => {
                    setUserConfirmed(e.target.checked);
                    if (!e.target.checked) {
                      setManualVerificationTime(null);
                      setPositionSetUntil(null);
                      setTempPositionSetUntil(getNextBusinessDay());
                    }
                  }}
                  className="w-5 h-5 mr-3"
                  style={{ accentColor: LIEBHERR_YELLOW }}
                />
                <span style={{ color: LIEBHERR_BLACK }}>
                  User confirmed position within last 4 hours
                </span>
              </label>
            </div>
          </div>

          {/* Position Thresholds Reference */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold mb-2" style={{ color: LIEBHERR_BLACK }}>
              Position Thresholds Reference:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {CRANE_POSITIONS.filter(p => p.threshold).map(pos => (
                <div key={pos.id} className="flex items-center">
                  <span className="w-2 h-2 rounded-full mr-2" 
                        style={{ backgroundColor: lastPosition === pos.id ? LIEBHERR_YELLOW : LIEBHERR_GREY }}></span>
                  <span style={{ color: LIEBHERR_BLACK }}>
                    {pos.label}: <strong>{pos.threshold} km/h</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Decision Output */}
        {decision && (
          <>
            {/* Success Message Banner */}
            {showSuccessMessage && (
              <div className="bg-green-500 rounded-lg shadow-lg p-4 text-white flex items-center justify-center gap-3 animate-pulse">
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg font-semibold">Position updated successfully ✓</span>
              </div>
            )}

            {/* Decision Case */}
            <div className={`${decision.color} rounded-lg shadow-lg p-6 text-white`}>
              <div className="flex items-start gap-4">
                <AlertIcon className="w-12 h-12 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{decision.title}</h2>
                  <p className="text-lg mb-3">{decision.description}</p>
                  <div className="bg-white bg-opacity-20 rounded p-3">
                    <p className="font-semibold">Action: {decision.action}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* App Display Mockup */}
            <div ref={statusViewRef} className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ borderTop: `4px solid ${LIEBHERR_YELLOW}` }}>
              <div className="p-4" style={{ backgroundColor: LIEBHERR_BLACK }}>
                <h3 className="text-lg font-bold text-white">App Display - Status View</h3>
              </div>
              <div className="p-6">
                {/* Mobile App Mockup */}
                <div className="max-w-md mx-auto border-4 rounded-2xl overflow-hidden" style={{ borderColor: LIEBHERR_BLACK }}>
                  <div className="p-6 space-y-4" style={{ backgroundColor: '#F9FAFB' }}>
                    <div className="text-center">
                      <h4 className="text-xl font-bold" style={{ color: LIEBHERR_BLACK }}>
                        CRANE XYZ-123
                      </h4>
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm" style={{ color: LIEBHERR_GREY }}>Wind Forecast:</span>
                        <span className="text-2xl font-bold" style={{ color: LIEBHERR_BLACK }}>
                          {forecastWind} km/h
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: LIEBHERR_GREY }}>Status:</span>
                        <span className={`font-bold ${decision.alertLevel === 'none' ? 'text-green-600' : 
                                         decision.alertLevel === 'confirm' ? 'text-yellow-600' : 
                                         decision.alertLevel === 'medium' ? 'text-orange-600' :
                                         'text-red-600'}`}>
                          {decision.appStatus}
                        </span>
                      </div>
                      {offlineHours < 0.083 && (
                        <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Connected - Live data</span>
                        </div>
                      )}
                    </div>

                    {offlineHours >= 0.083 && (
                      <div className="bg-yellow-50 border-2 rounded-lg p-4" style={{ borderColor: LIEBHERR_YELLOW }}>
                        <div className="flex items-start gap-2 mb-3">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: LIEBHERR_BLACK }} />
                          <div className="text-sm">
                            <strong style={{ color: LIEBHERR_BLACK }}>CONNECTION STATUS</strong>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm" style={{ color: LIEBHERR_BLACK }}>
                          <p>Machine offline since: Friday 17:00 ({offlineHours} hours)</p>
                          <p>Last known position: {CRANE_POSITIONS.find(p => p.id === lastPosition)?.label}</p>
                          {manualVerificationTime ? (
                            <p className="font-semibold text-green-700">
                              ✓ Last verified: manually {getManualVerificationAge()} ago by Site Manager
                            </p>
                          ) : (
                            <p>Last verified: {offlineHours} hours ago</p>
                          )}
                          
                          {positionSetUntil && !isPositionSettingExpired() && (
                            <div className="mt-3 pt-3 border-t border-yellow-300">
                              <p className="font-semibold" style={{ color: LIEBHERR_BLACK }}>
                                📅 Position set until: {formatDateTime(positionSetUntil)}
                              </p>
                              <p className="text-xs mt-1" style={{ 
                                color: allowMachineOverride ? '#059669' : '#DC2626' 
                              }}>
                                {allowMachineOverride 
                                  ? '✓ Machine updates will overwrite this setting'
                                  : '🔒 Machine updates are ignored until then'
                                }
                              </p>
                            </div>
                          )}
                          
                          {positionSetUntil && isPositionSettingExpired() && forecastWind > 35 && (
                            <div className="mt-3 pt-3 border-t border-red-300">
                              <p className="font-semibold text-red-700">
                                ⚠️ Position setting expired: {formatDateTime(positionSetUntil)}
                              </p>
                              <p className="text-xs mt-1 text-red-600">
                                Please re-verify crane position
                              </p>
                            </div>
                          )}
                          
                          {decision.alertLevel === 'none' && (
                            <p className="mt-3 font-semibold text-green-700">
                              ℹ️ Current forecast ({forecastWind} km/h) is safe for all crane positions. No action needed.
                            </p>
                          )}
                          
                          {decision.alertLevel === 'confirm' && (
                            <div className="mt-3 space-y-2">
                              {positionSetUntil && !isPositionSettingExpired() && (
                                <div className="mb-2 p-2 bg-blue-50 rounded">
                                  <p className="text-xs font-semibold" style={{ color: LIEBHERR_BLACK }}>
                                    📅 Position set until: {formatDateTime(positionSetUntil)}
                                  </p>
                                  <p className="text-xs mt-1" style={{ color: LIEBHERR_GREY }}>
                                    {allowMachineOverride 
                                      ? 'Machine updates will overwrite manual setting'
                                      : 'Machine updates are ignored until then'
                                    }
                                  </p>
                                </div>
                              )}
                              <p className="font-semibold">Please confirm current position:</p>
                              <p>Is crane still in "{CRANE_POSITIONS.find(p => p.id === lastPosition)?.label}" position?</p>
                            </div>
                          )}
                          
                          {(decision.alertLevel === 'medium' || decision.alertLevel === 'high' || decision.alertLevel === 'critical') && (
                            <p className="mt-3 font-semibold text-red-700">
                              ⚠️ Action required: {decision.action}
                            </p>
                          )}
                        </div>

                        <button 
                          className="w-full mt-4 py-2 px-4 rounded font-semibold"
                          style={{ backgroundColor: LIEBHERR_YELLOW, color: LIEBHERR_BLACK }}
                        >
                          Update Position Manually
                        </button>
                      </div>
                    )}

                    {offlineHours < 0.083 && decision.alertLevel !== 'none' && (
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                        <p className="text-sm font-semibold" style={{ color: LIEBHERR_BLACK }}>
                          {decision.alertLevel === 'confirm' && '⚠️ Position verification recommended'}
                          {(decision.alertLevel === 'medium' || decision.alertLevel === 'high') && '⚠️ Action required: ' + decision.action}
                          {decision.alertLevel === 'critical' && '🚨 Critical: ' + decision.action}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Position Selection Mockup */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ borderTop: `4px solid ${LIEBHERR_YELLOW}` }}>
              <div className="p-4" style={{ backgroundColor: LIEBHERR_BLACK }}>
                <h3 className="text-lg font-bold text-white">App Display - Manual Position Selection</h3>
              </div>
              <div className="p-6">
                {/* Mobile App Mockup */}
                <div className="max-w-md mx-auto border-4 rounded-2xl overflow-hidden" style={{ borderColor: LIEBHERR_BLACK }}>
                  <div className="p-6 space-y-4" style={{ backgroundColor: '#F9FAFB' }}>
                    <div className="text-center">
                      <h4 className="text-xl font-bold" style={{ color: LIEBHERR_BLACK }}>
                        Update Crane Position
                      </h4>
                      <p className="text-sm mt-1" style={{ color: LIEBHERR_GREY }}>
                        Select current crane configuration
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {CRANE_POSITIONS.filter(p => p.threshold).map(pos => (
                        <button
                          key={pos.id}
                          onClick={() => setTempSelectedPosition(pos.id)}
                          className={`p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                            tempSelectedPosition === pos.id 
                              ? 'border-4 shadow-lg' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          style={{
                            borderColor: tempSelectedPosition === pos.id ? LIEBHERR_YELLOW : undefined,
                            backgroundColor: 'white'
                          }}
                        >
                          {/* Simple crane visualization */}
                          <div className="text-center mb-2">
                            {pos.id === 'extended' && (
                              <div className="text-4xl">🏗️</div>
                            )}
                            {pos.id === 'partial' && (
                              <div className="text-4xl">🏗️</div>
                            )}
                            {pos.id === 'down' && (
                              <div className="text-4xl">🏗️</div>
                            )}
                            {pos.id === 'jackknife' && (
                              <div className="text-4xl">🏗️</div>
                            )}
                          </div>
                          
                          <div className="text-center">
                            <p className="text-xs font-semibold mb-1" style={{ color: LIEBHERR_BLACK }}>
                              {pos.label}
                            </p>
                            <p className="text-xs font-bold" style={{ 
                              color: forecastWind <= pos.threshold ? '#059669' : '#DC2626' 
                            }}>
                              Max {pos.threshold} km/h
                            </p>
                            {forecastWind > pos.threshold && (
                              <p className="text-xs text-red-600 mt-1">
                                ⚠️ Unsafe
                              </p>
                            )}
                            {forecastWind <= pos.threshold && (
                              <p className="text-xs text-green-600 mt-1">
                                ✓ Safe
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="bg-white rounded-lg p-4 shadow border-2" style={{ borderColor: LIEBHERR_GREY }}>
                      <div className="text-sm space-y-2" style={{ color: LIEBHERR_BLACK }}>
                        <div className="flex justify-between">
                          <span style={{ color: LIEBHERR_GREY }}>Current Forecast:</span>
                          <span className="font-bold">{forecastWind} km/h</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: LIEBHERR_GREY }}>Selected Position:</span>
                          <span className="font-bold">
                            {CRANE_POSITIONS.find(p => p.id === tempSelectedPosition)?.label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: LIEBHERR_GREY }}>Max Safe Wind:</span>
                          <span className={`font-bold ${
                            forecastWind <= (CRANE_POSITIONS.find(p => p.id === tempSelectedPosition)?.threshold || 0)
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}>
                            {CRANE_POSITIONS.find(p => p.id === tempSelectedPosition)?.threshold} km/h
                          </span>
                        </div>
                      </div>
                    </div>

                    {forecastWind > (CRANE_POSITIONS.find(p => p.id === tempSelectedPosition)?.threshold || 0) && (
                      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3">
                        <p className="text-sm font-semibold text-red-700">
                          ⚠️ Warning: Selected position is unsafe for current forecast
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          Consider moving to a safer position
                        </p>
                      </div>
                    )}

                    {/* Position Valid Until */}
                    <div className="bg-white rounded-lg p-4 shadow border-2" style={{ borderColor: LIEBHERR_GREY }}>
                      <label className="block text-sm font-semibold mb-2" style={{ color: LIEBHERR_BLACK }}>
                        Set crane position valid until:
                      </label>
                      <input
                        type="datetime-local"
                        value={tempPositionSetUntil}
                        onChange={(e) => setTempPositionSetUntil(e.target.value)}
                        className="w-full p-2 border-2 rounded"
                        style={{ borderColor: LIEBHERR_YELLOW }}
                      />
                      {isLongDuration(tempPositionSetUntil) && (
                        <div className="mt-2 bg-yellow-50 border border-yellow-300 rounded p-2">
                          <p className="text-xs text-yellow-800">
                            ⚠️ You're setting position for more than 7 days
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Machine Override Toggle */}
                    <div className="bg-white rounded-lg p-4 shadow border-2" style={{ borderColor: LIEBHERR_GREY }}>
                      <label className="flex items-start cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempAllowMachineOverride}
                          onChange={(e) => setTempAllowMachineOverride(e.target.checked)}
                          className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0"
                          style={{ accentColor: LIEBHERR_YELLOW }}
                        />
                        <div>
                          <span className="text-sm font-semibold" style={{ color: LIEBHERR_BLACK }}>
                            Update if machine is connected and sends different position
                          </span>
                          <p className="text-xs mt-1" style={{ color: LIEBHERR_GREY }}>
                            {tempAllowMachineOverride 
                              ? 'Machine data will overwrite this manual setting if connection is restored'
                              : 'Manual position setting will be kept even if machine reports different position'
                            }
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <button 
                        onClick={handleConfirmPosition}
                        className="w-full py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: LIEBHERR_YELLOW, color: LIEBHERR_BLACK }}
                      >
                        Confirm & Save Position
                      </button>
                      <button 
                        onClick={() => {
                          setTempSelectedPosition(lastPosition);
                          setTempPositionSetUntil(positionSetUntil || getNextBusinessDay());
                          setTempAllowMachineOverride(allowMachineOverride);
                        }}
                        className="w-full py-2 px-4 rounded-lg font-medium border-2 hover:bg-gray-50 transition-colors"
                        style={{ borderColor: LIEBHERR_GREY, color: LIEBHERR_BLACK, backgroundColor: 'white' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* SMS Notification */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ borderTop: `4px solid ${LIEBHERR_YELLOW}` }}>
                <div className="p-4" style={{ backgroundColor: LIEBHERR_BLACK }}>
                  <h3 className="text-lg font-bold text-white">SMS Notification</h3>
                </div>
                <div className="p-6">
                  {decision.smsContent ? (
                    <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm" style={{ color: LIEBHERR_BLACK }}>
                      <p className="whitespace-pre-wrap">{decision.smsContent}</p>
                    </div>
                  ) : (
                    <div className="text-center py-8" style={{ color: LIEBHERR_GREY }}>
                      <p>No SMS sent for this scenario</p>
                      <p className="text-sm mt-2">
                        {decision.alertLevel === 'none' && 'Forecast is safe - no notification needed'}
                        {decision.alertLevel === 'confirm' && 'In-app prompt only - SMS sent if no response after 1 hour'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Email Notification */}
              <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ borderTop: `4px solid ${LIEBHERR_YELLOW}` }}>
                <div className="p-4" style={{ backgroundColor: LIEBHERR_BLACK }}>
                  <h3 className="text-lg font-bold text-white">Email Notification</h3>
                </div>
                <div className="p-6">
                  {decision.emailContent ? (
                    <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm" style={{ color: LIEBHERR_BLACK }}>
                      <p className="whitespace-pre-wrap">{decision.emailContent}</p>
                    </div>
                  ) : (
                    <div className="text-center py-8" style={{ color: LIEBHERR_GREY }}>
                      <p>No email sent for this scenario</p>
                      <p className="text-sm mt-2">
                        {decision.alertLevel === 'none' && 'Forecast is safe - no notification needed'}
                        {decision.alertLevel === 'confirm' && 'In-app prompt only - email sent if no response after 1 hour'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer Note */}
        <div className="bg-white rounded-lg shadow p-4 text-sm" style={{ color: LIEBHERR_GREY }}>
          <p className="text-center">
            💡 <strong>Product Manager Tip:</strong> Try different scenarios to understand the decision logic. 
            Pay attention to when alerts are suppressed vs. sent, and how offline duration affects the system's behavior.
            Use the Manual Position Selection to set positions with validity periods and see how it affects the Status View.
          </p>
        </div>
      </div>
    </div>
  );
}
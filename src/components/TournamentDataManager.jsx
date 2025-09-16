import React, { useState } from 'react';
import { Download, Upload, Database, RefreshCw, Save } from 'lucide-react';

const TournamentDataManager = ({ tournaments, onImportTournaments }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Export tournaments to JSON file
  const exportTournaments = () => {
    setIsExporting(true);
    try {
      const dataToExport = {
        tournaments: tournaments,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `tournaments-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      console.log('✅ Tournaments exported successfully');
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert('Failed to export tournaments');
    } finally {
      setIsExporting(false);
    }
  };

  // Import tournaments from JSON file
  const importTournaments = (event) => {
    setIsImporting(true);
    const file = event.target.files[0];
    
    if (!file) {
      setIsImporting(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        if (importedData.tournaments && Array.isArray(importedData.tournaments)) {
          onImportTournaments(importedData.tournaments);
          console.log(`✅ Imported ${importedData.tournaments.length} tournaments`);
          alert(`Successfully imported ${importedData.tournaments.length} tournaments!`);
        } else {
          throw new Error('Invalid file format');
        }
      } catch (error) {
        console.error('❌ Import failed:', error);
        alert('Failed to import tournaments. Please check the file format.');
      } finally {
        setIsImporting(false);
        event.target.value = ''; // Reset input
      }
    };
    
    reader.readAsText(file);
  };

  // Save to localStorage as backup
  const saveToLocalStorage = () => {
    try {
      const backupData = {
        tournaments: tournaments,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('tournamentBackup', JSON.stringify(backupData));
      alert('Tournaments saved to browser storage!');
      console.log('✅ Tournaments saved to localStorage');
    } catch (error) {
      console.error('❌ localStorage save failed:', error);
      alert('Failed to save to browser storage');
    }
  };

  // Load from localStorage
  const loadFromLocalStorage = () => {
    try {
      const backupData = localStorage.getItem('tournamentBackup');
      if (backupData) {
        const parsed = JSON.parse(backupData);
        if (parsed.tournaments && Array.isArray(parsed.tournaments)) {
          onImportTournaments(parsed.tournaments);
          alert(`Loaded ${parsed.tournaments.length} tournaments from browser storage!`);
          console.log('✅ Tournaments loaded from localStorage');
        }
      } else {
        alert('No backup found in browser storage');
      }
    } catch (error) {
      console.error('❌ localStorage load failed:', error);
      alert('Failed to load from browser storage');
    }
  };

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Database className="text-orange-600" size={24} />
        <h3 className="text-lg font-semibold text-orange-900">Tournament Data Management</h3>
      </div>
      
      <div className="mb-4 text-sm text-orange-800">
        <p className="mb-2">
          <strong>⚠️ Temporary Solution:</strong> Since your backend doesn't have persistent database storage,
          use these tools to backup and restore your tournaments.
        </p>
        <p className="text-orange-700">
          For permanent solution, set up MySQL database (see DATABASE_SETUP.md guide).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Export Button */}
        <button
          onClick={exportTournaments}
          disabled={isExporting || tournaments.length === 0}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Download size={16} />
          )}
          <span>Export JSON</span>
        </button>

        {/* Import Button */}
        <label className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
          {isImporting ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          <span>Import JSON</span>
          <input
            type="file"
            accept=".json"
            onChange={importTournaments}
            disabled={isImporting}
            className="hidden"
          />
        </label>

        {/* Save to Browser */}
        <button
          onClick={saveToLocalStorage}
          disabled={tournaments.length === 0}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          <Save size={16} />
          <span>Save Local</span>
        </button>

        {/* Load from Browser */}
        <button
          onClick={loadFromLocalStorage}
          className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          <RefreshCw size={16} />
          <span>Load Local</span>
        </button>
      </div>

      <div className="mt-4 text-xs text-orange-600">
        <p>💡 Tips:</p>
        <p>• Export before creating new tournaments as backup</p>
        <p>• Use "Save Local" for quick temporary storage</p>
        <p>• Share JSON files with team members</p>
      </div>
    </div>
  );
};

export default TournamentDataManager;

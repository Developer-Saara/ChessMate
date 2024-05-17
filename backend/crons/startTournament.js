const cron = require('node-cron');
const Tournament = require('../models/tournament'); // Adjust the path as needed
const moment = require('moment');

// Function to fetch tournaments from the database and update the array
const updateTournamentsToMonitor = async () => {
  try {
    const now = new Date();
console.log(`Current time: ${now.toLocaleString()}`);

// Fetch tournaments from the database where startDateAndTime matches the current date and time
const tournaments = await Tournament.find({
  startDateAndTime: { $gte: now },
  status: 'upcoming'
});

console.log(`Fetched tournaments to update: ${tournaments.length}`);

// Update tournaments to ongoing if the start time is reached
for (const tournament of tournaments) {
  const timeDifference = Math.floor((new Date(tournament.startDateAndTime) - now) / (1000 * 60)); // Difference in minutes
  console.log(`Tournament ${tournament._id} time difference: ${timeDifference} minutes`);

  if (timeDifference === 0) {
    // Update tournament status to "ongoing"
    tournament.status = 'ongoing';
    await tournament.save();
    console.log(`Tournament ${tournament._id} status updated to ongoing.`);
  }
}
  } catch (error) {
    console.error('Error updating tournaments to monitor:', error);
  }
};

// Initial call to update tournaments to monitor

const cronRunner = ()=>{

  updateTournamentsToMonitor().then(() => console.log('Initial update completed.'));
  
  // Schedule a cron job to update tournaments every minute
  cron.schedule('* * * * *', () => {
    console.log('Cron job started: Updating tournaments to monitor...');
    updateTournamentsToMonitor().then(() => console.log('Cron job completed.'));
  });
}


module.exports = cronRunner
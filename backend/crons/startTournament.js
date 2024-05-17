const cron = require('node-cron');
const Tournament = require('../models/tournament'); // Adjust the path as needed
const moment = require('moment');

// Function to fetch tournaments from the database and update the array
const updateTournamentsToMonitor = async () => {
  try {
    // Fetch tournaments from the database where startDateAndTime matches the current date and time
    const now = moment();
    const tournaments = await Tournament.find({
      startDateAndTime: { $lte: now.toDate() }, // Matches tournaments where start time is less than or equal to current time
      status: 'upcoming' // Only fetch tournaments that are upcoming
    });

    console.log(`Tournaments to update:`, tournaments);

    // Update tournaments to ongoing if the start time is reached
    tournaments.forEach(async tournament => {
      // Calculate time difference between current time and start time
      const timeDifference = moment(tournament.startDateAndTime).diff(now, 'minutes');
      if (timeDifference === 0) {
        // Update tournament status to "ongoing"
        tournament.status = 'ongoing';
        await tournament.save();
        console.log(`Tournament ${tournament._id} status updated to ongoing.`);
      }
    });
  } catch (error) {
    console.error('Error updating tournaments to monitor:', error);
  }
};

// Initial call to update tournaments to monitor
updateTournamentsToMonitor();

// Schedule a cron job to update tournaments every minute
cron.schedule('* * * * *', () => {
  console.log('Updating tournaments to monitor...');
  updateTournamentsToMonitor();
});
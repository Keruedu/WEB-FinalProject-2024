const moment = require('moment');

function timeAgo(date) {
  return moment(date).fromNow();
}

module.exports = { timeAgo };
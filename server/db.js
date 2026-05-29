const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Configure Sequelize connection to SQLite database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false // Disable logging query logs to clean console
});

// User Model
const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  diaryName: {
    type: DataTypes.STRING,
    defaultValue: 'My Diary'
  },
  companionName: {
    type: DataTypes.STRING,
    defaultValue: 'Ollie'
  },
  companionEmoji: {
    type: DataTypes.STRING,
    defaultValue: '🦉'
  },
  coins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastWrittenDate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  settingsPin: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isPremium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

// DiaryEntry Model
const DiaryEntry = sequelize.define('DiaryEntry', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  mood: {
    type: DataTypes.STRING,
    allowNull: true
  },
  pageStyle: {
    type: DataTypes.STRING,
    defaultValue: 'classic'
  },
  font: {
    type: DataTypes.STRING,
    defaultValue: 'dancing'
  },
  wordCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  date: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// Polaroid Model (Attachment)
const Polaroid = sequelize.define('Polaroid', {
  src: {
    type: DataTypes.TEXT, // Store base64 or URL
    allowNull: false
  },
  caption: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  left: {
    type: DataTypes.STRING,
    defaultValue: '30%'
  },
  top: {
    type: DataTypes.STRING,
    defaultValue: '25%'
  },
  tilt: {
    type: DataTypes.STRING,
    defaultValue: '2deg'
  }
});

// Sticker Model (Decoration)
const Sticker = sequelize.define('Sticker', {
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  left: {
    type: DataTypes.STRING,
    defaultValue: '50%'
  },
  top: {
    type: DataTypes.STRING,
    defaultValue: '40%'
  }
});

// MemorySnap Model
const MemorySnap = sequelize.define('MemorySnap', {
  src: {
    type: DataTypes.TEXT, // Store base64 or URL
    allowNull: false
  },
  date: {
    type: DataTypes.STRING, // YYYY-MM-DD
    allowNull: false
  },
  linkedEntryId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

// CoinTransaction Model
const CoinTransaction = sequelize.define('CoinTransaction', {
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false // e.g. 'Daily Challenge', 'Memory Match', 'Claim Bonus'
  }
});

// Relationships/Associations
User.hasMany(DiaryEntry, { onDelete: 'CASCADE', foreignKey: 'userId' });
DiaryEntry.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(MemorySnap, { onDelete: 'CASCADE', foreignKey: 'userId' });
MemorySnap.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(CoinTransaction, { onDelete: 'CASCADE', foreignKey: 'userId' });
CoinTransaction.belongsTo(User, { foreignKey: 'userId' });

DiaryEntry.hasMany(Polaroid, { onDelete: 'CASCADE', foreignKey: 'entryId' });
Polaroid.belongsTo(DiaryEntry, { foreignKey: 'entryId' });

DiaryEntry.hasMany(Sticker, { onDelete: 'CASCADE', foreignKey: 'entryId' });
Sticker.belongsTo(DiaryEntry, { foreignKey: 'entryId' });

module.exports = {
  sequelize,
  User,
  DiaryEntry,
  Polaroid,
  Sticker,
  MemorySnap,
  CoinTransaction
};

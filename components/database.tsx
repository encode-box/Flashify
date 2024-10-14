import SQLite from 'react-native-sqlite-storage';

const db = SQLite.openDatabase(
  {
    name: 'flashcards.db',
    location: 'default',
  },
  () => {
    console.log('Database opened');
  },
);

// function to open the database
export function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  return new Promise((resolve, reject) => {
    SQLite.openDatabase(
      {
        name: 'flashcards.db',
        location: 'default',
      },
      (db) => {
        console.log('Database opened');
        resolve(db);
      },
      (error) => {
        console.error('Error opening database:', error);
        reject(error);
      }
    );
  });
}

// delete database
//SQLite.deleteDatabase({ name: 'flashcards.db', location: 'default' });

// Define the flashcard type
interface Flashcard {
  id: number;
  title: string;
  summary: string;
  questions: { question: string, answer: string }[];
}

export const setupDatabase = async (db: SQLite.SQLiteDatabase) => {
  (await db).transaction(tx => {
    // Create tables and insert sample data
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS flashcards (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL
    )`
    );

    // Create questions table
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      flashcard_id INTEGER,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      FOREIGN KEY(flashcard_id) REFERENCES flashcards(id)
    )`
    );

    // Insert sample flashcards
    const flashcards = [
      { id: 1, title: 'Capital Cities', summary: 'Capital Cities of the World' },
      { id: 2, title: 'Grade 1 Math', summary: 'Grade 1 Math Problems' },
    ];

    flashcards.forEach(flashcard => {
      tx.executeSql(
        `INSERT INTO flashcards (id, title, summary) VALUES (?, ?, ?)`,
        [flashcard.id, flashcard.title, flashcard.summary]
      );
    });

    // Insert sample questions
    const questions = [
      { flashcard_id: 1, question: 'What is the capital of France?', answer: 'Paris' },
      { flashcard_id: 1, question: 'What is the capital of Germany?', answer: 'Berlin' },
      { flashcard_id: 1, question: 'What is the capital of Italy?', answer: 'Rome' },
      { flashcard_id: 2, question: 'What is 1 + 1?', answer: '2' },
      { flashcard_id: 2, question: 'What is 2 + 2?', answer: '4' },
    ];

    questions.forEach(q => {
      tx.executeSql(
        `INSERT INTO questions (flashcard_id, question, answer) VALUES (?, ?, ?)`,
        [q.flashcard_id, q.question, q.answer]
      );
    });
  }, (error) => {
    console.error('Transaction error:', error);
  }, () => {
    console.log('Transaction successful');
  });
};

// Function to query flashcards and their questions
export function queryFlashcards() {
  db.transaction((tx) => {
    // Query flashcards
    tx.executeSql(
      `SELECT * FROM flashcards`,
      [],
      (tx, results) => {
        const rows = results.rows;
        for (let i = 0; i < rows.length; i++) {
          const flashcard = rows.item(i);
          console.log(`Flashcard ID: ${flashcard.id}, Title: ${flashcard.title}, Summary: ${flashcard.summary}`);

          // Query questions for each flashcard
          tx.executeSql(
            `SELECT * FROM questions WHERE flashcard_id = ?`,
            [flashcard.id],
            (tx, questionResults) => {
              const questionRows = questionResults.rows;
              for (let j = 0; j < questionRows.length; j++) {
                const question = questionRows.item(j);
                console.log(`  Question: ${question.question}, Answer: ${question.answer}`);
              }
            }
          );
        }
      }
    );
  }, (error) => {
    console.error('Transaction error:', error);
  }, () => {
    console.log('Query database successful');
  });
}

// Function to query only flashcard summaries
export function queryFlashcardSummaries(callback: (flashcards: Flashcard[]) => void) {
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT * FROM flashcards ORDER BY id DESC`,
      [],
      (tx, results) => {
        const rows = results.rows;
        const flashcards: Flashcard[] = [];
        for (let i = 0; i < rows.length; i++) {
          const flashcard = rows.item(i);
          flashcards.push({ id: flashcard.id, title: flashcard.title, summary: flashcard.summary, questions: [] });
        }
        callback(flashcards);
      }
    );
  }, (error) => {
    console.error('Transaction error:', error);
  }, () => {
    console.log('Query flashcard summaries successful');
  });
}

// Function to query questions and answers for a specific flashcard ID
export function queryFlashcardQuestions(flashcardId: number, callback: (questions: { question: string, answer: string }[]) => void) {
  db.transaction((tx) => {
    tx.executeSql(
      `SELECT * FROM questions WHERE flashcard_id = ? ORDER BY RANDOM()`,
      [flashcardId],
      (tx, results) => {
        const questionRows = results.rows;
        const questions: { question: string, answer: string }[] = [];
        for (let j = 0; j < questionRows.length; j++) {
          const question = questionRows.item(j);
          questions.push({ question: question.question, answer: question.answer });
        }
        callback(questions);
      }
    );
  }, (error) => {
    console.error('Transaction error:', error);
  }, () => {
    console.log('Query flashcard questions successful');
  });
}

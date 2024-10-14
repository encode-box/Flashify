import { useEffect, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, Modal, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Button, TextInput} from 'react-native';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import SQLite from 'react-native-sqlite-storage';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import styles from '@/components/styles';
import { z } from 'zod';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupDatabase } from '@/components/database';

const db = SQLite.openDatabase(
  {
    name: 'flashcards.db',
    location: 'default',
  },
  () => {
    console.log('Database opened');
  },
);

const client = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_PRIVATE_KEY
});

const flashcardZodSchema = z.object({
  title: z.string(),
  summary: z.string(),
  questions: z.array(z.object({
      question: z.string(),
      answer: z.string(),
  })),
}).required();

const categorizedTopics = {
  "Education": [
    {
      "title": "Math Practice",
      "summary": "Grade 2 Math Practice (Addition and Subtraction less than 100)"
    },
    {
      "title": "Vocabulary Building",
      "summary": "Vocabulary Building for Grade 2"
    },
    {
      "title": "History Knowledge",
      "summary": "American History Knowledge"
    },
    {
      "title": "Science Facts",
      "summary": "Interesting Science Facts for Kids"
    },
    {
      "title": "Geography Quiz",
      "summary": "World Capitals and Landmarks"
    },
  ],
  "Games and Puzzles": [
    {
      "title": "Charades",
      "summary": "Charades with Animals"
    },
    {
      "title": "Trivia Games",
      "summary": "Trivia Games with Movies"
    },
    {
      "title": "Would You Rather...",
      "summary": "Would You Rather..."
    },
    {
      "title": "Riddles",
      "summary": "Brain-teasing Riddles for All Ages"
    },
    {
      "title": "Emoji Pictionary",
      "summary": "Guess the Movie/Book from Emoji Combinations"
    },
  ],
  "Language Learning": [
    {
      "title": "Foreign Languages",
      "summary": "Entry level Chinese Vocabulary"
    },
    {
      "title": "Idioms and Expressions",
      "summary": "Idioms and Expressions"
    },

    {
      "title": "Tongue Twisters",
      "summary": "Challenging Tongue Twisters in Various Languages"
    },
  ],
  "Self-Improvement": [
    {
      "title": "Interview Questions",
      "summary": "Interview Questions"
    },
    {
      "title": "Motivation or Business Skills",
      "summary": "Motivation or Business Skills"
    },
    {
      "title": "Public Speaking Tips",
      "summary": "Techniques for Effective Public Speaking"
    },
    {
      "title": "Time Management",
      "summary": "Strategies for Better Time Management"
    },
  ],
  "Arts and Culture": [
    {
      "title": "Famous Paintings",
      "summary": "Recognize World-renowned Paintings and Artists"
    },
    {
      "title": "Musical Instruments",
      "summary": "Identify and Learn About Various Musical Instruments"
    },
    {
      "title": "World Cuisines",
      "summary": "Explore Traditional Dishes from Different Countries"
    },
  ],
  "Technology and Science": [
    {
      "title": "Coding Concepts",
      "summary": "Basic Programming Concepts for Beginners"
    },
    {
      "title": "Tech Inventions",
      "summary": "Timeline of Major Technological Inventions"
    },
    {
      "title": "Space Exploration",
      "summary": "Facts about Planets, Stars, and Space Missions"
    },
  ],
  "Health and Wellness": [
    {
      "title": "Nutrition Facts",
      "summary": "Essential Nutrients and Their Food Sources"
    },
    {
      "title": "Fitness Exercises",
      "summary": "Common Workout Moves and Their Benefits"
    },
    {
      "title": "Mental Health Tips",
      "summary": "Strategies for Maintaining Good Mental Health"
    },
  ]
};

const Stack = createStackNavigator();

function CreateFlashcardScreen() {
  const [isLoading, setIsLoading] = useState(false);  // State to track loading status
  const [error, setError] = useState(false);  // State to manage error dialog
  const [title, setTitle] = useState('');
  const [titleCharCount, setTitleCharCount] = useState(0);
  const [summary, setSummary] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigation = useNavigation();

  const handleGenerate = async () => {
    try {
      setIsLoading(true);
      const result = await sendTextToOpenAI(title, summary);
      if (result) {
        const flashcardData = JSON.parse(result);
        try {
          flashcardZodSchema.parse(flashcardData);
          await insertFlashcard(flashcardData);
          setIsModalVisible(true);
          setSuccessModalVisible(true);
        } catch (error) {
          console.error('Invalid flashcard data:', error);
          setIsModalVisible(true);
          setError(true);
        }
      }
    } catch (error) {
      console.error('Failed to generate flashcards:', error);
      setIsModalVisible(true);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTextToOpenAI = async (title: string, summary: string) => {
    try {
      const openaiPrompt =
  `Generate twenty flashcards based on the following information user provided and return a JSON object with the following structure:
  'title' uses user provided title if it is not empty, otherwise generate a title based on the recognizedText and flashcard topic (limit to 5 words).
  'summary' uses user provided summary if it is not empty, otherwise generate a summary based on the recognizedText and flashcard topic (limit to 15 words).
  'questions' is the array of questions and answers.
  Keep the questions precise and clear, for example, vocabulary building just generate words in the questions field, math questions just generate the math equations unless the request is about math text problems.
  If it is something like charades game that no need to answer, just generate words in the questions field, and answers are all empty strings.
  If the topic is not clear, just generate flashcards based on your knowledge.
   `

      setIsLoading(true);  // Start loading indicator during OpenAI request

      // Create a promise that rejects after 15 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('OpenAI request timed out')), 15000);
      });

      // Race the OpenAI request against the timeout
      const chatCompletion = await Promise.race([
        client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: openaiPrompt,
            },
            {
              role: "user",
              content: `the title is ${title} and the summary is ${summary}.`
            },
          ],
          response_format: zodResponseFormat(flashcardZodSchema, "flashcard"),
        }),
        timeoutPromise
      ]) as OpenAI.Chat.Completions.ChatCompletion;

      const completionMessage = chatCompletion.choices[0].message.content;
      console.log('OpenAI response: ', completionMessage);
      return completionMessage;
    } catch (error) {
      console.error('Error sending text to OpenAI API: ', error);
      throw error; // Re-throw the error to be caught in handleGenerate
    }
  };

  const insertFlashcard = async (flashcardData: { title: string, summary: string, questions: { question: string, answer: string }[] }) => {
    const db = await SQLite.openDatabase({ name: 'flashcards.db', location: 'default' });
  
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO flashcards (title, summary) VALUES (?, ?)',
        [flashcardData.title, flashcardData.summary],
        (_, result) => {
          const flashcardId = result.insertId;
          flashcardData.questions.forEach(q => {
            tx.executeSql(
              'INSERT INTO questions (flashcard_id, question, answer) VALUES (?, ?, ?)',
              [flashcardId, q.question, q.answer]
            );
          });
        },
        (_, error) => {
          console.error('Error inserting flashcard:', error);
          return true;
        }
      );
    }, (error) => {
      console.error('Transaction error:', error);
    }, () => {
      console.log('Flashcard inserted successfully');
    });
  };

  const handleSummaryChange = (text: string) => {
    if (text.length <= 200) {
      setSummary(text);
      setCharCount(text.length);
    }
  };

  const handleTitleChange = (text: string) => {
    if (text.length <= 50) {
      setTitle(text);
      setTitleCharCount(text.length);
    }
  };

  const TopicButton = ({ topic, onPress }: { topic: any, onPress: () => void }) => (
    <TouchableOpacity
      style={styles.topicButton}
      onPress={onPress}
    >
      <Text style={styles.topicButtonText}>{topic.title}</Text>
    </TouchableOpacity>
  );

  return(
  <GestureHandlerRootView style={styles.container}>
    <SafeAreaView style={styles.safeArea}>
    <TextInput 
      style={styles.input}
      placeholder="Enter the title of the flashcard (optional)"
      value={title}
      onChangeText={handleTitleChange}
      maxLength={50}
    />
    <Text style={styles.charCount}>{titleCharCount}/50</Text>
    <TextInput 
      style={styles.largeInput}
      placeholder="Enter a topic or idea (required)"
      value={summary}
      onChangeText={handleSummaryChange}
      maxLength={200}
      multiline
    />
    <Text style={styles.charCount}>{charCount}/200</Text>
    <TouchableOpacity 
      style={styles.generateButton} 
      onPress={handleGenerate}
    >
      <Text style={styles.generateButtonText}>Generate Flashcards</Text>
    </TouchableOpacity>
    <Text style={styles.titleIdea}>or tap one of the ideas below:</Text>
    <ScrollView
      contentContainerStyle={styles.scrollViewContent}
    >
      {Object.entries(categorizedTopics).map(([category, topics]) => (
        <View key={category} style={styles.categoryContainer}>
          <Text style={styles.categoryTitle}>{category}</Text>
          <View style={styles.topicContainer}>
            {topics.map((topic, index) => (
              <TopicButton
                key={`${category}-${index}`}
                topic={topic}
                onPress={() => {
                  setTitle(topic.title);
                  setSummary(topic.summary);
                  setTitleCharCount(topic.title.length);
                  setCharCount(topic.summary.length);
                }}
              />
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
    </SafeAreaView>

      {/* Combined Modal for Error and Success */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            {error ? (
              <>
                <Text style={styles.message}>An error occurred while generating flashcards. Please try again later.</Text>
                <Button title="Close" onPress={() => {
                  setIsModalVisible(false);
                  setError(false);
                }} />
              </>
            ) : (
              <>
                <Text style={styles.message}>Flashcards generated successfully!</Text>
                <Button 
                  title="Close" 
                  onPress={() => {
                    setIsModalVisible(false);
                    setSuccessModalVisible(false);
                    navigation.navigate('flashcards');
                  }} 
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Loading spinner */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

    </GestureHandlerRootView>
    
  )
};

export default function NewPage() {

  // Initialize the database once
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        const hasSetupDatabase = await AsyncStorage.getItem('hasSetupDatabase');
        if (hasSetupDatabase !== 'true') {
          await setupDatabase(db);
          await AsyncStorage.setItem('hasSetupDatabase', 'true');
        } 
      } catch (error) {
        console.error('Error initializing database:', error);
      }
    };
    initializeDatabase();
  }, []);
  
  return (
    <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#B3E5FC',
      },
      headerTintColor: '#000',
    }}>
      <Stack.Screen
        name="CreateFlashcard"
        component={CreateFlashcardScreen}
        options={{ title: 'Create Flashcard' }}
      />
    </Stack.Navigator>
  );
}

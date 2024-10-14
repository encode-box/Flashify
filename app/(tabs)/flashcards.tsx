import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, FlatList, Text, SafeAreaView, TouchableOpacity } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { ThemedView } from '@/components/ThemedView';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFocusEffect, useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';

import styles from '@/components/styles';
import { queryFlashcardSummaries, queryFlashcardQuestions } from '@/components/database';
import SQLite from 'react-native-sqlite-storage';
import Swiper from 'react-native-deck-swiper';
import FlipCard from "react-native-flip";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

const db = SQLite.openDatabase(
  {
    name: 'flashcards.db',
    location: 'default',
  },
  () => {
    console.log('Database opened');
  },
);

// Define the flashcard type
interface Flashcard {
  id: number;
  title: string;
  summary: string;
  questions: { question: string, answer: string }[];
}

type RootStackParamList = {
  Flashcard: { flashcard: Flashcard; title: string };
};

const Stack = createStackNavigator();

// FlashcardModal component
function FlashcardModal() {
  const route = useRoute<RouteProp<RootStackParamList, 'Flashcard'>>();
  const { flashcard } = route.params;
  const [questions, setQuestions] = useState<{ question: string, answer: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showingAnswer, setShowingAnswer] = useState(false);

  const flipAnimation = useSharedValue(0);

  useEffect(() => {
    queryFlashcardQuestions(flashcard.id, (fetchedQuestions) => {
      setQuestions(fetchedQuestions);
    });
  }, [flashcard.id]);

  const flipCard = () => {
    setShowingAnswer(!showingAnswer);
    flipAnimation.value = withTiming(showingAnswer ? 0 : 180, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  };

  const nextCard = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
      setShowingAnswer(false);
      flipAnimation.value = 0;
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prevIndex => prevIndex - 1);
      setShowingAnswer(false);
      flipAnimation.value = 0;
    }
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateY: `${flipAnimation.value}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotateY: `${flipAnimation.value - 180}deg` }],
      backfaceVisibility: 'hidden',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  if (questions.length === 0) {
    return (
      <View style={styles.cardContainer}>
        <Text style={styles.cardText}>No questions available</Text>
      </View>
    );
  }

  const currentCard = questions[currentIndex];

  return (
    <SafeAreaView style={styles.cardContainer}>
      <TouchableOpacity onPress={flipCard} activeOpacity={0.8}>
        <View style={styles.flipContainer}>
          <Animated.View style={[styles.card, { backgroundColor: '#FFA500' }, frontAnimatedStyle]}>
            <Text style={styles.cardText}>{currentCard.question}</Text>
          </Animated.View>
          <Animated.View style={[styles.card, { backgroundColor: '#40E0D0' }, backAnimatedStyle]}>
            <Text style={styles.cardText}>{currentCard.answer}</Text>
          </Animated.View>
        </View>
      </TouchableOpacity>
      <View style={styles.navigationButtons}>
        <TouchableOpacity onPress={prevCard} style={styles.navButton} disabled={currentIndex === 0}>
          <Text>Previous</Text>
        </TouchableOpacity>
        <Text>{`${currentIndex + 1} / ${questions.length}`}</Text>
        <TouchableOpacity onPress={nextCard} style={styles.navButton} disabled={currentIndex === questions.length - 1}>
          <Text>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function FlashcardsScreen() {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  // Function to refresh flashcards
  const refreshFlashcards = () => {
    queryFlashcardSummaries((flashcards) => {
      setFlashcards(flashcards);
    });
  };

  // Refresh flashcards when the screen is focused
  useFocusEffect(
    useCallback(() => {
      refreshFlashcards();
    }, [])
  );

  // Pull-to-refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    refreshFlashcards();
    setRefreshing(false);
  };

  const renderFlashcard = ({ item }: { item: Flashcard }) => (
    <Swipeable
      renderRightActions={() => (
        <View style={styles.rightActionsContainer}>
          <TouchableOpacity style={[styles.rightAction, { backgroundColor: 'red' }]} onPress={() => deleteFlashcard(item.id)}>
            <Text style={styles.actionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    >
      <TouchableOpacity 
        onPress={() => navigation.navigate('Flashcard', { 
          flashcard: item,
          title: item.title
        })}
        activeOpacity={1}
      >
        <View style={[styles.flashcardItem, { backgroundColor: '#E0F7FA' }]}>
          <Text style={styles.flashcardTitle}>{item.title}</Text>
          <Text style={styles.flashcardName}>{item.summary}</Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  // Function to delete a flashcard from the database
  function deleteFlashcard(flashcardId: number) {
    db.transaction((tx) => {
      tx.executeSql(
        `DELETE FROM flashcards WHERE id = ?`,
        [flashcardId],
        () => {
          console.log(`Flashcard with ID ${flashcardId} deleted`);
          refreshFlashcards(); // Refresh the list after deletion
        }
      );
      tx.executeSql(
        `DELETE FROM questions WHERE flashcard_id = ?`,
        [flashcardId],
        () => {
          console.log(`Questions for flashcard ID ${flashcardId} deleted`);
        }
      );
    }, (error) => {
      console.error('Transaction error:', error);
    });
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.flashcardList}>
          <FlatList
            data={flashcards}
            renderItem={renderFlashcard}
            keyExtractor={(item) => item.id.toString()}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </ThemedView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}


export default function StackScreen() {
  return (
    <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#B3E5FC',
      },
      headerTintColor: '#000', 
    }}>
      <Stack.Group>
        <Stack.Screen name="All Flashcards" component={FlashcardsScreen} />
      </Stack.Group>
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen 
          name="Flashcard" 
          component={FlashcardModal}
          options={({ route }: { route: { params?: { title?: string } } }) => ({ 
            title: route.params?.title ?? 'Flashcard' 
          })}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
}

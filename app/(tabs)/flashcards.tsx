import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, FlatList, Text, SafeAreaView, TouchableOpacity, Animated } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { ThemedView } from '@/components/ThemedView';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFocusEffect, useNavigation, RouteProp, useRoute } from '@react-navigation/native';
import { createStackNavigator, StackNavigationProp } from '@react-navigation/stack';

import styles from '@/components/styles';
import { queryFlashcardSummaries, queryFlashcardQuestions } from '@/components/database';
import SQLite from 'react-native-sqlite-storage';
import Swiper from 'react-native-deck-swiper';

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
  const [flippedCards, setFlippedCards] = useState<{ [key: number]: boolean }>({});
  const [isFinished, setIsFinished] = useState(false);
  const flipAnimations = useRef<{ [key: number]: Animated.Value }>({});

  useEffect(() => {
    queryFlashcardQuestions(flashcard.id, (fetchedQuestions) => {
      setQuestions(fetchedQuestions);
      const initialFlipAnimations: { [key: number]: Animated.Value } = {};
      fetchedQuestions.forEach((_, index) => {
        initialFlipAnimations[index] = new Animated.Value(0);
      });
      flipAnimations.current = initialFlipAnimations;
    });
  }, [flashcard.id]);

  const flipCard = (index: number) => {
    const isFlipped = flippedCards[index] || false;
    if (flipAnimations.current[index]) {
      Animated.spring(flipAnimations.current[index], {
        toValue: isFlipped ? 0 : 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start();

      setFlippedCards(prev => ({ ...prev, [index]: !isFlipped }));
    }
  };

  const renderCard = (card: { question: string, answer: string }, index: number) => {
    if (!card || typeof card.question === 'undefined' || typeof card.answer === 'undefined') {
      return (
        <View style={styles.cardContainer}>
          <Text style={styles.cardText}>No data available</Text>
        </View>
      );
    }

    const frontInterpolate = flipAnimations.current[index]?.interpolate({
      inputRange: [0, 180],
      outputRange: ['0deg', '180deg'],
    }) || '0deg';

    const backInterpolate = flipAnimations.current[index]?.interpolate({
      inputRange: [0, 180],
      outputRange: ['180deg', '360deg'],
    }) || '180deg';

    const frontAnimatedStyle = {
      transform: [{ rotateY: frontInterpolate }],
    };

    const backAnimatedStyle = {
      transform: [{ rotateY: backInterpolate }],
    };

    return (
      <TouchableOpacity onPress={() => flipCard(index)} activeOpacity={1} style={styles.cardContainer}>
        <Animated.View style={[styles.card, frontAnimatedStyle]}>
          <Text style={styles.cardText}>{card.question}</Text>
        </Animated.View>
        <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
          <Text style={styles.cardText}>{card.answer}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  if (isFinished) {
    return (
      <View style={styles.cardContainer}>
        <Text style={[styles.cardText, { color: 'gray', justifyContent: 'center', alignItems: 'center' }]}>The end</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Swiper
        cards={questions}
        renderCard={renderCard}
        onSwiped={(cardIndex) => {
          console.log(cardIndex);
          setFlippedCards(prev => ({ ...prev, [cardIndex]: false }));
          if (flipAnimations.current[cardIndex]) {
            flipAnimations.current[cardIndex].setValue(180);
          }
        }}
        onSwipedAll={() => {
          console.log('onSwipedAll');
          setIsFinished(true);
        }}
        cardIndex={0}
        backgroundColor={'#4FD0E9'}
        stackSize={3}
        verticalSwipe={true}
        horizontalSwipe={true}
      />
    </View>
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


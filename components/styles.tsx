import { Dimensions, StyleSheet } from 'react-native';

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0F7FA',
  },
  safeArea: {
    flex: 1,
    paddingTop: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  flashcardContainer: {
    flex: 1,
    padding: 16,
  },
  flashcardList: {
    marginTop: 16,
    marginHorizontal: 16,
    backgroundColor: '#E0F7FA',
  },
  flashcardItem: {
    padding: 16,
    backgroundColor: '#E0F7FA',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  leftAction: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 16,
  },
  rightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightAction: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    width: 100,
    height: 100,
  },
  actionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  flashcardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  flashcardName: {
    fontSize: 16,
    color: '#666',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
  },
  titleIdea: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 16,
    color: 'gray',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  input: {
    height: 40,
    borderColor: 'gray', 
    borderWidth: 1,
    borderRadius: 5, 
    paddingHorizontal: 10,
    marginVertical: 10, 
    fontSize: 16,
    backgroundColor: 'white', 
    marginTop: 16,
    marginHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  largeInput: {
    height: 100,
    borderColor: 'gray',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
    marginVertical: 10,
    textAlignVertical: 'top',
    backgroundColor: 'white',
    marginTop: 16,
    marginHorizontal: 16,
  },
  generateButton: {
    backgroundColor: '#7cd6fc',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
    marginHorizontal: 36,
  },
  generateButtonText: {
    color: 'gray',
    fontSize: 16,
    fontWeight: 'bold',
  },
  charCount: {
    textAlign: 'right',
    color: 'gray',
    marginHorizontal: 16,
  },
  topicContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  categoryContainer: {
    marginHorizontal: 6,
    backgroundColor: '#E0F7FA',
    marginVertical: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    backgroundColor: '#E0F7FA',
  },
  card: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFA500',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    borderColor: 'gray',
    borderWidth: 1,
  },
  cardBack: {
    backgroundColor: '#40E0D0',
    position: 'absolute',
    top: 0,
  },
  cardText: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
    color: '#333',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 10,
    backgroundColor: '#E0F7FA',
  },
  topicButton: {
    backgroundColor: 'lightblue',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
  },
  topicButtonText: {
    fontSize: 14,
    color: '#333',
  },
  flipContainer: {
    width: width > 768 ? '70%' : '90%', // Adjust width based on device width
    aspectRatio: 3 / 4,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipButton: {
    padding: 10,
    marginTop: 20,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
  },
  navButton: {
    padding: 10,
    backgroundColor: '#B3E5FC',
    borderRadius: 8,
    width: 100,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default styles;

import React from 'react';
import { View, Button, Text, StyleSheet, Dimensions, Pressablem} from 'react-native';
import CachedImage from 'react-native-expo-cached-image';
import { useNavigation } from '@react-navigation/native';
import ProgressBar from 'react-native-progress/Bar';
import { TouchableOpacity } from 'react-native-gesture-handler';

function ListingCard(props) {
  const navigation = useNavigation();
  
  var data = props.projectData; 

  //Data 
  var currentAmount = data.currentAmount / 1E18; // Gotta convert from bigNumber to regular integer; 
  var currentState = data.currentState;
  var fundraisingDeadline = data.fundRaisingDeadline; 
  var projectCreator = data.projectCreator.toString().substring(0, 16);
  var projectDescription = data.projectDescription.length > 115 ? data.projectDescription.substring(0, 115) : data.projectDescription;
  var projectGoalAmount = data.projectGoalAmount;
  var projectImageLink = data.projectImageLink;
  var projectTitle = data.projectTitle; 
  var currentProgress = currentAmount / projectGoalAmount; 

  const milliseconds = fundraisingDeadline * 1000; 
  const dateObject = new Date(milliseconds)

  var dateOutput = new Date(dateObject).toLocaleDateString();
  
  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('FundraiserListing', {projectId: props.projectId, loggedIn: props.loggedIn, address: props.address, projectData: data, projectAddy:projectCreator, nav: navigation})}
      activeOpacity={1}
      // Tweak so cards don't get opaque on scroll
      delayPressIn={50}>   

      <View style={styles.cardView}> 
        <CachedImage style={styles.cardImage} source={{uri: projectImageLink}} /> 
        <View style={styles.textView}>
          <Text style={styles.titleText}>{projectTitle} </Text>
          <Text style={styles.creatorInitialText}>Fundraiser created by <Text style={styles.creatorText}>{projectCreator}... </Text> </Text>
          <Text style={styles.projectDescriptionText}>{projectDescription} </Text>
          <Text style={styles.currentRaisedText}>${currentAmount} raised of ${projectGoalAmount} goal. </Text>

          <ProgressBar progress={currentProgress} color='#35D07F' width={330} height={8} style={styles.progress}/>
          <Text style={styles.dateText}>Fundraising ends on {dateOutput} </Text>
        </View>
      </View>      
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({ 
  cardView: {
    width : Dimensions.get('window').width - 25,
    height : 440,
    marginBottom : 30,
    borderRadius : 15,
    elevation: 3,
    backgroundColor : '#FFFFFF',
    borderColor: '#EDEEEF',
    borderWidth: 1,
    overflow : 'hidden',
  }, 
  cardImage : {
      width : '100%',
      height : '55%',
  },
  textView : {
    flex : 1,
    alignItems : 'flex-start',
    justifyContent : 'flex-start',
    marginTop: 6,
    marginLeft: 7,
    marginRight: 5  
}, 
  titleText: {
    fontFamily: 'proximanova_bold',
    fontSize: 23, 
    color: '#2E3338',    
  },
  creatorInitialText: {
    fontFamily: 'proxima',
    fontSize: 15, 
    color: '#2E3338',
    marginTop: 5, 
  }, 
  creatorText: {
    fontFamily: 'proxima',
    fontSize: 14,
    color: '#767676',
  },
  projectDescriptionText: {
    fontFamily: 'proxima',
    fontSize: 16,
    color: '#2E3338',
    marginTop: 15, 
    marginRight: 6
  },
  currentRaisedText: {
    fontFamily: 'proximanova_bold',
    fontSize: 15,
    color: '#2E3338',
    marginTop: 20,
  },
  progress: {
    marginTop: 7
  },
  dateText: {
    fontFamily: 'proximanova_bold',
    fontSize: 15,
    color: '#2E3338',
    position: 'absolute', 
    bottom: 10, 
    right: 4
  },
});

export default ListingCard;
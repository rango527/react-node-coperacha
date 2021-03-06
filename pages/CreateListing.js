import React, { useContext, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TextInput, Dimensions, Keyboard, TouchableWithoutFeedback, Image, Alert } from 'react-native';
import { Icon } from 'react-native-elements';
import { kit } from '../root';
import { useNavigation } from '@react-navigation/native';
import {   
  requestTxSig,
  waitForSignedTxs,
  FeeCurrency
} from '@celo/dappkit';
import { toTxResult } from "@celo/connect";
import * as Linking from 'expo-linking';
import LogIn from '../components/LogIn';
import firebaseStorageRef from '../components/Firebase';
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import AppContext from '../components/AppContext';
import { Button } from 'react-native-elements';

function CreateListing(props) {
  const navigation = useNavigation();
  
  // Get context variables
  const context = useContext(AppContext);
  const address = context.address; 
  const loggedIn = context.loggedIn; 

  // Paload info
  const [title, onChangeTitle] = useState('');
  const [description, onChangeDescription] = useState('');
  const [amount, onChangeAmount] = useState(0);
  const [deadline, onChangeDeadline] = useState(0);
  const [image, imageResponse] = useState(null);
  const [imageState, setImageState] = useState('No Image Selected'); 
  const [imageDownloadUrl, setImageDownloadUrl] = useState('');

  // ui
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  var currentDate = new Date();

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleChange = (date) => {
    //date is a Date object, convert to unix timestamp
    var currentDate = new Date();
    currentDate = Math.floor(currentDate.getTime()/1000);
    var userDefinedDate = Math.floor(date.getTime()/1000);
    
    var differenceDateTime = Math.ceil((userDefinedDate-currentDate)/3600)/24;

    if(differenceDateTime < 0){
      onChangeDeadline(0);
    }else{
      onChangeDeadline(differenceDateTime);
    }
  }

  const handleConfirm = (_) => {   
    hideDatePicker();
  };

  const pickImage = async () => {
    let selectedImage = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      includeBase64: false,
      maxHeight: 200,
      maxWidth: 300,
    });
    
    if(!selectedImage.cancelled){
      imageResponse(selectedImage.uri);
      firestorePost(selectedImage.uri);
    }
  }

  const firestorePost = async (localImageUrl) => {
    // Transform to blob
    const fetchResponse = await fetch(localImageUrl);
    const blob = await fetchResponse.blob();

    // Change filename
    const storageFileName = localImageUrl.substring(localImageUrl.lastIndexOf('/')+1);

    var uploadImage = firebaseStorageRef.ref('fundraiserImages').child(storageFileName).put(blob);

    uploadImage.on('state_changed', (snapshot) => {
      setImageState('Image Uploading');
    }, (error) => {
        setImageState(null);
    }, () => {
        uploadImage.snapshot.ref.getDownloadURL().then((downloadURL) => {
            setImageDownloadUrl(downloadURL);
            setImageState('Image Uploaded');
        });
    });
  }
  
  const write = async () => {
    //problem with image upload
    if(imageState == null){
      Alert.alert(
        "Reupload image!"
      ); 

      return;
    }

    if(title.length == 0){
      Alert.alert(
        "Add a title!"
      );

      return;
    }

    if(description.length == 0){
      Alert.alert(
        "Add a description!"
      );

      return;
    }

    // if fundraising amount is 0 then alert 
    if(amount <= 0){
      Alert.alert(
        "Fundraising amount must be greater than 0 cUSD!"
      ); 

      return;
    }

    if(deadline == 0){
      Alert.alert(
        "Add a deadline!"
      );

      return;
    }

    const requestId = 'update_projects'
    const dappName = 'Coperacha'
    const callback = Linking.makeUrl('/my/path')

    /* 
    Solidity function: 
    
    function startProject(string calldata title, string calldata description, 
      string calldata imageLink, uint durationInDays, uint amountToRaise)
    */    

    // Create a transaction object to update the contract
    const txObject = await props.celoCrowdfundContract.methods.startProject(title, description, imageDownloadUrl, deadline, amount);
    // Send a request to the Celo wallet to send an update transaction to the HelloWorld contract
    requestTxSig(
      kit,
      [
        {
          from: address,
          to: props.celoCrowdfundContract._address, // interact w/ address of CeloCrowdfund contract
          tx: txObject,
          feeCurrency: FeeCurrency.cUSD
        }
      ],
      { requestId, dappName, callback }
    )

    // Get the response from the Celo wallet
    const dappkitResponse = await waitForSignedTxs(requestId)
    const tx = dappkitResponse.rawTxs[0]
    
    // Get the transaction result, once it has been included in the Celo blockchain
    let result = await toTxResult(kit.web3.eth.sendSignedTransaction(tx)).waitReceipt()
  
    console.log(`Project created contract update transaction receipt: `, result);

    // User can't go back
    navigation.replace('CreateReceipt');
  }

  return (
    <View style={styles.entireThing}>
      {loggedIn ? ( 
        <ScrollView>
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}> 
              <View>
                <Text style={styles.headerInitial}> Create <Text style={styles.header}>Fundraiser </Text> </Text>
                  <View > 
                  
                    {/* Image Picker */}
                    <View style={styles.imagePickerView}> 
                      <Icon style={styles.imageIcon} raised name='photo-camera' size={18} onPress={pickImage} />
                      <Text style={styles.imageStateText}> {imageState} </Text>
                      {image && <Image source={{ uri: image, cache: 'only-if-cached' }} style={styles.imagePreview} />}
                    </View> 
                    
                    {/* Title  */}
                    <Text style={styles.headers}>Title</Text>
                    <TextInput style={styles.textbox} onChangeText={onChangeTitle} onSubmitEditing={Keyboard.dismiss} placeholder='Title' maxLength={50} value={title}/>

                    {/* Description */}
                    <Text style={styles.headers}>Description</Text>
                    <TextInput multiline={true} numberOfLines={10} style={styles.textboxDescription} onChangeText={onChangeDescription} placeholder='Description' maxLength={300} value={description}/>
                    
                    {/* Amount to raise (cUSD) */}
                    <Text style={styles.headers}>Fundraising amount (cUSD)</Text>
                    <TextInput style={styles.textbox} keyboardType='numeric' onChangeText={onChangeAmount} placeholder='Amount' value={amount.toString()}/>
          
                    {/* Deadline */}
                    <Button title={"Pick a deadline"} 
                    buttonStyle={styles.createFundraiserButton} 
                    titleStyle={styles.fundraiserTextStyle} 
                    type="solid"  
                    onPress={showDatePicker}/>

                    <DateTimePickerModal isVisible={isDatePickerVisible} mode="date" onConfirm={handleConfirm} onCancel={hideDatePicker} onChange={handleChange}/>  
                    <Text style={styles.deadlineText}> Fundraiser ends in {deadline.toString()} days from now.</Text>

                    <Button title={"Create Fundraiser"} 
                    buttonStyle={styles.createFundraiserButton} 
                    titleStyle={styles.fundraiserTextStyle} 
                    type="solid"  
                    onPress={() => write()}/>
                   
                  
                  </View>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
      ) : (
        <View style={styles.centerLogin}>
          <Image style={styles.Image} source={require("../assets/login1.png")}></Image>
          <LogIn reason={"Create your fundraiser now!"} handleLogIn={context.handleLogIn}/>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  entireThing: {
    height: '100%',
    backgroundColor: '#ffffff'
  },
  headerInitial: { 
    fontSize: 25,
    color: '#2E3338',
    fontFamily: 'proximanova_bold',

    marginTop: 60,
    marginLeft: 10,
  },
  header:{
    fontSize: 25,
    color: '#35D07F',
    fontFamily: 'proximanova_bold',

  },
  headers:{
    fontSize: 22,
    color: '#2E3338',
    fontFamily: 'proximanova_bold',
    marginLeft: 15,
    marginRight: 10,
    marginBottom: 6
  },
  imageIcon:{
    backgroundColor: '#ABADAF'
  },
  imagePickerView: {
    flexDirection: "row",
    marginTop: 10, 
    marginLeft: 6,
    marginBottom: 10,
  },
  imageStateText: {
    fontSize: 15,
    color: '#2E3338',
    fontFamily: 'proxima',
    marginTop: 18
  }, 
  imagePreview: {
    marginLeft: 135, 
    width: 50, 
    height: 50,
    borderRadius: 10
  },
  textbox: {
    minHeight: 40,
    width: Dimensions.get('window').width - 30,
    marginLeft: 15,
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#ABADAF'
  }, 
  textboxDescription: {
    minHeight: 100,
    width: Dimensions.get('window').width - 30,
    marginLeft: 15,
    paddingLeft: 10,
    paddingRight: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderRadius: 5,
    borderColor: '#ABADAF'
  },
  deadlineText: {
    fontFamily: 'proxima',
    color: '#2E3338',
    fontSize: 18,
    marginTop: 20,
    marginLeft: 38,
    marginBottom: 30,
  },
  deadlineButton: {
    borderColor: '#DDDDDD'
  }, 
  deadlineTextStyle: {
    fontFamily: 'proxima',
    fontSize: 18, 
    color: '#2E3338'
  },
  centerLogin: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center'
  },
  createFundraiserButton: {
    marginLeft: 10,
    marginTop: 20,
    height: 40,
    width: Dimensions.get('window').width - 20,
    backgroundColor: "#35D07F"
  }, 
  fundraiserTextStyle: {
    fontFamily: 'proximanova_bold',
    fontSize: 18, 
    color: '#FFFFFF'
  },
  Image: {
    width: 300,
    height: 300,
    marginBottom: 20,
    resizeMode: 'contain',
  },
});

export default CreateListing;
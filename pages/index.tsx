"use client";
import type { NextPage } from "next";
import { useCallback, useEffect, useState } from "react";
import {
  Accordion,
  Button,
  Flex,
  Heading,
  Image,
  Tooltip,
  useColorMode,
  useToast,
  ChakraProvider, Select, Box, Text, VStack,
} from "@chakra-ui/react";

import {
  useInitWeb3InboxClient,
  useManageSubscription,
  useW3iAccount,
} from "@web3inbox/widget-react";
import "@web3inbox/widget-react/dist/compiled.css";

import { useAccount, usePublicClient, useSignMessage } from "wagmi";
import { FaBell, FaBellSlash, FaPause, FaPlay } from "react-icons/fa";
import { BsPersonFillCheck, BsSendFill } from "react-icons/bs";
import useSendNotification from "../utils/useSendNotification";
import { useInterval } from "usehooks-ts";
import Preferences from "../components/Preferences";
import Messages from "../components/Messages";
import Subscription from "../components/Subscription";
import { sendNotification } from "../utils/fetchNotify";
import Subscribers from "../components/Subscribers";

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string;
const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN as string;

const HoroscopeData = {
  Aries: "Today, you will feel a burst of energy and enthusiasm. It's a great day to start new projects and pursue your passions.",
  Taurus: "You may find yourself in a reflective mood today. Take some time to think about your long-term goals and how to achieve them.",
  Gemini: "Communication will be key for you today. Express your thoughts and feelings clearly, and you'll find that people are receptive.",
  Cancer: "Emotions may run high today. Don't be afraid to lean on loved ones for support and guidance.",
  Leo: "You're feeling confident and charismatic today. Use your charm to your advantage in both personal and professional situations.",
  Virgo: "Focus on your health and well-being today. A little self-care can go a long way in improving your overall quality of life.",
  Libra: "Your social life is thriving today. Enjoy some quality time with friends and maybe even meet some new people.",
  Scorpio: "You're feeling particularly determined and resourceful today. Use these qualities to overcome any challenges that come your way.",
  Sagittarius: "Adventure awaits you today. Whether it's a spontaneous trip or a new hobby, embrace the excitement.",
  Capricorn: "Your work ethic is impressive today. Focus on your career goals and you'll make significant progress.",
  Aquarius: "Your creative side is shining today. Use your imagination to solve problems and come up with innovative ideas.",
  Pisces: "You may feel a bit dreamy today, but that's okay. Allow yourself to daydream and tap into your intuition."
};

const Home: NextPage = () => {

  /** Horescopes **/
  const [selectedHoroscope, setSelectedHoroscope] = useState('');
  const [horoscopePrediction, setHoroscopePrediction] = useState('');

  const handleHoroscopeChange = (event) => {
    setSelectedHoroscope(event.target.value);
  };

  const getHoroscope = () => {
    setHoroscopePrediction(horoscopeData[selectedHoroscope]);
  };


  /** Web3Inbox SDK hooks **/
  const isW3iInitialized = useInitWeb3InboxClient({
    projectId,
    domain: appDomain,
  });
  const {
    account,
    setAccount,
    register: registerIdentity,
    identityKey,
  } = useW3iAccount();
  const {
    subscribe,
    unsubscribe,
    isSubscribed,
    isSubscribing,
    isUnsubscribing,
  } = useManageSubscription(account);

  const { address } = useAccount({
    onDisconnect: () => {
      setAccount("");
    },
  });
  const { signMessageAsync } = useSignMessage();
  const wagmiPublicClient = usePublicClient();

  const { colorMode } = useColorMode();
  const toast = useToast();

  const { handleSendNotification, isSending } = useSendNotification();
  const [lastBlock, setLastBlock] = useState<string>();
  const [isBlockNotificationEnabled, setIsBlockNotificationEnabled] =
    useState(true);

  const signMessage = useCallback(
    async (message: string) => {
      const res = await signMessageAsync({
        message,
      });

      return res as string;
    },
    [signMessageAsync]
  );

  // We need to set the account as soon as the user is connected
  useEffect(() => {
    if (!Boolean(address)) return;
    setAccount(`eip155:1:${address}`);
  }, [signMessage, address, setAccount]);

  const handleRegistration = useCallback(async () => {
    if (!account) return;
    try {
      await registerIdentity(signMessage);
    } catch (registerIdentityError) {
      console.error({ registerIdentityError });
    }
  }, [signMessage, registerIdentity, account]);

  useEffect(() => {
    if (!identityKey) {
      handleRegistration();
    }
  }, [handleRegistration, identityKey]);

  // handleSendNotification will send a notification to the current user and includes error handling.
  // If you don't want to use this hook and want more flexibility, you can use sendNotification.
  const handleTestNotification = useCallback(async () => {
    if (isSubscribed) {
      handleSendNotification({
        title: "GM Ladies",
        body: "Hack it until you make it!",
        icon: `${window.location.origin}/WalletConnect-blue.svg`,
        url: window.location.origin,
        type: "promotional",
      });
    }
  }, [handleSendNotification, isSubscribed]);

  // Example of how to send a notification based on some "automation".
  // sendNotification will make a fetch request to /api/notify
  const handleBlockNotification = useCallback(async () => {
    if (isSubscribed && account && isBlockNotificationEnabled) {
      const blockNumber = await wagmiPublicClient.getBlockNumber();
      if (lastBlock !== blockNumber.toString()) {
        setLastBlock(blockNumber.toString());
        try {
          toast({
            title: "New block",
            position: "top",
            variant: "subtle",
          });
          await sendNotification({
            accounts: [account], // accounts that we want to send the notification to.
            notification: {
              title: "New block",
              body: blockNumber.toString(),
              icon: `${window.location.origin}/eth-glyph-colored.png`,
              url: `https://etherscan.io/block/${blockNumber.toString()}`,
              type: "transactional",
            },
          });
        } catch (error: any) {
          toast({
            title: "Failed to send new block notification",
            description: error.message ?? "Something went wrong",
          });
        }
      }
    }
  }, [
    wagmiPublicClient,
    isSubscribed,
    lastBlock,
    account,
    toast,
    isBlockNotificationEnabled,
  ]);

  useInterval(() => {
    handleBlockNotification();
  }, 12000);

  return (
    <Flex w="full" flexDirection={"column"} maxW="700px">
      <Image
        aria-label="WalletConnect"
        src={
          colorMode === "dark"
            ? "/WalletConnect-white.svg"
            : "/WalletConnect-black.svg"
        }
      />
      <Heading alignSelf={"center"} textAlign={"center"} mb={6}>
        Web3Inbox hooks
      </Heading>
      <ChakraProvider>
      <VStack spacing={4}>
        <Text fontSize="2xl">Horoscope Selector</Text>
        <Select
          placeholder="Select your horoscope"
          value={selectedHoroscope}
          onChange={handleHoroscopeChange}
        >
          {Object.keys(horoscopeData).map((sign) => (
            <option key={sign} value={sign}>
              {sign}
            </option>
          ))}
        </Select>
        <Button onClick={getHoroscope}>Get Horoscope</Button>
        <Box>
          <Text fontSize="lg">{horoscopePrediction}</Text>
        </Box>
      </VStack>
    </ChakraProvider>

      <Flex flexDirection="column" gap={4}>
        {isSubscribed ? (
          <Flex flexDirection={"column"} alignItems="center" gap={4}>
            <Button
              leftIcon={<BsSendFill />}
              variant="outline"
              onClick={handleTestNotification}
              isDisabled={!isW3iInitialized}
              colorScheme="purple"
              rounded="full"
              isLoading={isSending}
              loadingText="Sending..."
            >
              Send test notification
            </Button>
            <Button
              leftIcon={isBlockNotificationEnabled ? <FaPause /> : <FaPlay />}
              variant="outline"
              onClick={() =>
                setIsBlockNotificationEnabled((isEnabled) => !isEnabled)
              }
              isDisabled={!isW3iInitialized}
              colorScheme={isBlockNotificationEnabled ? "orange" : "blue"}
              rounded="full"
            >
              {isBlockNotificationEnabled ? "Pause" : "Resume"} block
              notifications
            </Button>
            <Button
              leftIcon={<FaBellSlash />}
              onClick={unsubscribe}
              variant="outline"
              isDisabled={!isW3iInitialized || !account}
              colorScheme="red"
              isLoading={isUnsubscribing}
              loadingText="Unsubscribing..."
              rounded="full"
            >
              Unsubscribe
            </Button>
          </Flex>
        ) : (
          <Tooltip
            label={
              !Boolean(address)
                ? "Connect your wallet first."
                : "Register your account."
            }
            hidden={Boolean(account)}
          >
            <Button
              leftIcon={<FaBell />}
              onClick={subscribe}
              colorScheme="cyan"
              rounded="full"
              variant="outline"
              w="fit-content"
              alignSelf="center"
              isLoading={isSubscribing}
              loadingText="Subscribing..."
              isDisabled={!Boolean(address) || !Boolean(account)}
            >
              Tell me please!
            </Button>
          </Tooltip>
        )}

        {isSubscribed && (
          <Accordion defaultIndex={[1]} allowToggle mt={10} rounded="xl">
            <Subscription />
            <Messages />
            <Preferences />
            <Subscribers />
          </Accordion>
        )}
      </Flex>
    </Flex>
  );
};

export default Home;

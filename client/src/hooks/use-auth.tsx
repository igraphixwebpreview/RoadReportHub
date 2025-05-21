import { createContext, ReactNode, useContext, useState } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User as FirebaseUser } from "firebase/auth";
import { setDoc, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export type RegisterData = {
  username: string;
  email: string;
  password: string;
};

export type LoginData = {
  identifier: string; // username or email
  password: string;
};

type AuthContextType = {
  user: FirebaseUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<FirebaseUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<FirebaseUser, Error, RegisterData>;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Register
  const registerMutation = useMutation({
    mutationFn: async ({ username, email, password }: RegisterData) => {
      setIsLoading(true);
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // 2. Store username in Firestore (users collection, doc id = uid)
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username,
        email,
      });
      setUser(userCredential.user);
      setIsLoading(false);
      return userCredential.user;
    },
    onSuccess: (user: FirebaseUser) => {
      toast({
        title: "Registration successful",
        description: `Welcome to RoadBlock, ${user.email}!`,
      });
    },
    onError: (error: Error) => {
      setIsLoading(false);
      setError(error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Login
  const loginMutation = useMutation({
    mutationFn: async ({ identifier, password }: LoginData) => {
      setIsLoading(true);
      let email = identifier;
      // If identifier is not an email, look up by username
      if (!identifier.includes("@")) {
        // Query Firestore for user with this username
        const q = query(collection(db, "users"), where("username", "==", identifier));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          throw new Error("No user found with that username");
        }
        // Assume usernames are unique, get the first match
        const userDoc = querySnapshot.docs[0];
        email = userDoc.data().email;
      }
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      setIsLoading(false);
      return userCredential.user;
    },
    onSuccess: (user: FirebaseUser) => {
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.email}!`,
      });
    },
    onError: (error: Error) => {
      setIsLoading(false);
      setError(error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await signOut(auth);
      setUser(null);
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

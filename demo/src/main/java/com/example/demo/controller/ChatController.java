package com.example.demo.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;



@RestController 
@RequestMapping("/api/chat")
public class ChatController {
    private final ChatClient chatClient;
    ChatController(ChatClient.Builder chatClientBuilder){
        this.chatClient=chatClientBuilder.build();
    }
    @GetMapping("/test")
    public String askAI(@RequestParam String userInput) {
        return chatClient.prompt().user(userInput).call().content();
    }
    

}

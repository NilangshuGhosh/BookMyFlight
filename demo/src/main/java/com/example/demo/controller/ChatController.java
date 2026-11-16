package com.example.demo.controller;

import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.FlightResponse;
import com.example.demo.service.FlightAiTools;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;



@RestController 
@RequestMapping("/api/chat")
public class ChatController {
    private final FlightAiTools flightAiTools;
    private final ChatClient chatClient;
    ChatController(ChatClient.Builder chatClientBuilder, FlightAiTools flightAiTools){
        this.flightAiTools = flightAiTools;
        this.chatClient=chatClientBuilder.defaultSystem("You are a helpful Flight booking assistant for Book My Flight App").defaultTools(flightAiTools).build();
    }
    @GetMapping("/test")
    public String askAI(@RequestParam String userInput) {
        // return chatClient.prompt().user(userInput).call().content();
    return chatClient.prompt().user(userInput).call().content();
    
    }
    

}

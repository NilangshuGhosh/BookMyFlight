package com.example.demo.controller;

import org.springframework.web.bind.annotation.RestController;

import com.example.demo.dto.ChatRequest;
import com.example.demo.dto.FlightResponse;
import com.example.demo.service.FlightAiTools;
import com.example.demo.dto.ChatResponse;


import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;




@RestController 
@RequestMapping("/api/chat")
public class ChatController {
    private final FlightAiTools flightAiTools;
    private final ChatClient chatClient;
    private final ChatMemory chatMemory;
    ChatController(ChatClient.Builder chatClientBuilder, FlightAiTools flightAiTools,ChatMemory chatMemory){
        this.flightAiTools = flightAiTools;
        this.chatMemory=chatMemory;
        this.chatClient=chatClientBuilder.defaultAdvisors(MessageChatMemoryAdvisor.builder(chatMemory).build()).defaultSystem("You are a helpful Flight booking assistant for Book My Flight App").defaultTools(flightAiTools).build();
        
    }
    @GetMapping("/test")
    public String TestAskAI(@RequestParam String userInput) {
        // return chatClient.prompt().user(userInput).call().content();
    return chatClient.prompt().user(userInput).call().content();
    
    }
    @PostMapping({"","/"})
    public ChatResponse askAi(@RequestBody ChatRequest chatRequest) {
        // Create a convId if the user has not sent one yet.
        String convId=(chatRequest.conversationId()==null||chatRequest.conversationId().isBlank())
        ?java.util.UUID.randomUUID().toString()
        :chatRequest.conversationId();
        if(chatRequest.userInput()==null||chatRequest.userInput().isBlank()){
            return new ChatResponse("Please provide a valid question or message.",convId);
        }
        String assistantReply= chatClient.prompt()    
             .advisors(advisor->advisor.param(ChatMemory.CONVERSATION_ID,convId))
             .user(chatRequest.userInput())
             .call()
             .content();
             return new ChatResponse(assistantReply, convId);
    }
    

}

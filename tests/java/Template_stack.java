import java.util.*;

public class Template_stack {
static boolean valid(String s) {
    Deque<Character> stack=new ArrayDeque<>();
    for(char c:s.toCharArray()) {
        if(c=='(') stack.push(')');
        else if(c=='[') stack.push(']');
        else if(c=='{') stack.push('}');
        else if(stack.isEmpty() || stack.pop()!=c) return false;
    }
    return stack.isEmpty(); // Input alphabet: brackets only.
}
}

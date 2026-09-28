import java.util.*;

public class Template_window {
static int longest(String s) {
    Map<Character,Integer> last = new HashMap<>();
    int left=0,best=0;
    for(int right=0;right<s.length();right++) {
        char c=s.charAt(right);
        if(last.containsKey(c)) left=Math.max(left,last.get(c)+1);
        last.put(c,right);
        best=Math.max(best,right-left+1);
    }
    return best; // Assumes code units are the desired units.
}
}

import java.util.*;

public class Template_search {
static int find(String text,String pattern) {
    for(int start=0;start+pattern.length()<=text.length();start++) {
        int j=0;while(j<pattern.length() && text.charAt(start+j)==pattern.charAt(j))j++;
        if(j==pattern.length())return start;
    }
    return -1; // Empty pattern returns 0.
}
}

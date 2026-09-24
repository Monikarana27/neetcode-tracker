import java.util.*;

public class Template_palindrome {
static int count(String s) {
    int count=0;
    for(int center=0;center<2*s.length()-1;center++) {
        int l=center/2,r=l+center%2;
        while(l>=0 && r<s.length() && s.charAt(l)==s.charAt(r)){count++;l--;r++;}
    }
    return count;
}
}

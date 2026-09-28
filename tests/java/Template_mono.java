import java.util.*;

public class Template_mono {
static int[] waits(int[] a) {
    int[] out=new int[a.length];
    Deque<Integer> stack=new ArrayDeque<>();
    for(int i=0;i<a.length;i++) {
        while(!stack.isEmpty() && a[stack.peek()]<a[i]) {
            int old=stack.pop(); out[old]=i-old;
        }
        stack.push(i);
    }
    return out;
}
}
